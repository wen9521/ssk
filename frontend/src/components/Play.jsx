import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Play.css';
import { simpleAI, getHandRank, compareHands, isPair, isThreeOfAKind, isStraight, isFlush, isTwoPair, isFullHouse, isFourOfAKind, isStraightFlush, isFiveOfAKind, isThreeFlush, isThreeStraight, getHandTypeName } from '../game-logic/thirteen-water-rules'; 

const OUTER_MAX_WIDTH = 420;
const PAI_DUN_HEIGHT = 133;
const CARD_HEIGHT = Math.round(PAI_DUN_HEIGHT * 0.94);
const CARD_WIDTH = Math.round(CARD_HEIGHT * 46 / 66);

export default function Play() {
  const { roomId } = useParams();
  const [players, setPlayers] = useState([]);
  const [myPoints, setMyPoints] = useState(0);
  const [myName, setMyName] = useState('');
  const [myCards, setMyCards] = useState([]);
  const [selected, setSelected] = useState({ area: '', cards: [] });
  const [head, setHead] = useState([]);
  const [middle, setMiddle] = useState([]);
  const [tail, setTail] = useState([]);
  const [submitMsg, setSubmitMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [roomStatus, setRoomStatus] = useState(''); // waiting, playing, comparing, result
  const [showResult, setShowResult] = useState(false);
  const [splitIndex, setSplitIndex] = useState(0);
  const [allPlayed, setAllPlayed] = useState(false);
  const [resultModalData, setResultModalData] = useState(null);
  const [hasShownResult, setHasShownResult] = useState(false);
  const [draggingCard, setDraggingCard] = useState(null); 
  const [isDraggingOver, setIsDraggingOver] = useState(null); 
  const [timeLeft, setTimeLeft] = useState(0); 
  const GAME_DURATION = 60; 

  const navigate = useNavigate();

  async function apiFetch(url, opts) {
    try {
      const res = await fetch(url, opts);
      const data = await res.json();
      if (!data.success) throw new Error(data.message || '操作失败');
      return data;
    } catch (e) {
      throw e;
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('token');
    const nickname = localStorage.getItem('nickname');
    if (!token) {
      navigate('/login');
      return;
    }
    setMyName(nickname);
    fetchMyPoints();
  }, []);

  useEffect(() => {
    fetchPlayers();
    const timer = setInterval(fetchPlayers, 2000);
    return () => clearInterval(timer);
  }, [roomId, showResult]);

  useEffect(() => {
    fetchMyCards();
    const timer = setInterval(fetchMyCards, 1500);
    return () => clearInterval(timer);
  }, [roomId]);

    useEffect(() => {
        let timerInterval = null;
        if (roomStatus === 'playing' && !submitted) { 
            setTimeLeft(GAME_DURATION); 
            timerInterval = setInterval(() => {
                setTimeLeft(prevTime => {
                    if (prevTime <= 1) {
                        clearInterval(timerInterval);
                         if (!submitted) {
                             handleStartCompare(); 
                             setSubmitMsg('时间到，自动提交');
                         }
                        return 0;
                    }
                    return prevTime - 1;
                });
            }, 1000);
        } else {
             clearInterval(timerInterval); 
             setTimeLeft(0);
        }

        return () => clearInterval(timerInterval);
    }, [roomStatus, submitted]); 

  // 移除自动重置逻辑
  // useEffect(() => { ... }, [showResult, roomId]);

  useEffect(() => {
    if (roomStatus === 'waiting' && showResult) {
      setShowResult(false);
      setIsReady(true);
    } else if (roomStatus === 'waiting' && !showResult) { 
         setIsReady(true);
    }
  }, [roomStatus, showResult]);

  useEffect(() => {
    if (myCards.length === 13 && !submitted) {
      setHasShownResult(false);
      setSplitIndex(0);
    }
  }, [myCards, submitted]);

  useEffect(() => {
    if (!submitted) return;
    if (allPlayed && players.length === 4 && !hasShownResult) {
      fetchAllResults();
      setHasShownResult(true);
    }
  }, [submitted, allPlayed, players, hasShownResult]);

  async function fetchPlayers() {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`https://9526.ip-ddns.com/api/room_info.php?roomId=${roomId}&token=${token}`);
      const data = await res.json();
      if (!data.success) {
        alert(data.message || '房间已被删除或不存在');
        navigate('/');
        return;
      }
      setPlayers(data.players);
      setRoomStatus(data.status);
      const me = data.players.find(p => p.name === localStorage.getItem('nickname'));
      if (me) {
          setSubmitted(!!me.submitted);
          if (data.status === 'playing' && !me.submitted && myCards.length !== 13) {
               fetchMyCards();
          }
      }

    } catch (e) {
      alert('网络错误或房间已删除');
      navigate('/');
    }
  }

  async function fetchMyPoints() {
    const phone = localStorage.getItem('phone');
    if (!phone) return;
    const data = await apiFetch('https://9526.ip-ddns.com/api/find_user.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    setMyPoints(data.user.points || 0);
  }

  async function fetchMyCards() {
    const token = localStorage.getItem('token');
    const data = await apiFetch(`https://9526.ip-ddns.com/api/my_cards.php?roomId=${roomId}&token=${token}`);
    if (!data.submitted && Array.isArray(data.cards) && data.cards.length === 13) {
         setMyCards(data.cards);
         setHead([]);
         setMiddle([]);
         setTail([]);
         setSubmitted(false); 
    } else if (data.submitted) {
         setSubmitted(true); 
    } else if (!data.submitted && Array.isArray(data.cards) && data.cards.length === 0 && roomStatus === 'playing') {
         if (Array.isArray(data.head) && Array.isArray(data.middle) && Array.isArray(data.tail)) {
             setHead(data.head);
             setMiddle(data.middle);
             setTail(data.tail);
             setMyCards([]);
         }
    }

  }

  async function fetchAllResults() {
    const token = localStorage.getItem('token');
    const data = await apiFetch(`https://9526.ip-ddns.com/api/room_results.php?roomId=${roomId}&token=${token}`);
    if (Array.isArray(data.players)) {
      const resultPlayers = data.players.map(p => {
        let head = Array.isArray(p.head) ? p.head.slice(0, 3) : [];
        let middle = Array.isArray(p.middle) ? p.middle.slice(0, 5) : [];
        let tail = Array.isArray(p.tail) ? p.tail.slice(0, 5) : [];
        let score = typeof p.score === "number" ? p.score :
          (p.result && typeof p.result.score === "number" ? p.result.score : 0);
        let isFoul = typeof p.isFoul === "boolean" ? p.isFoul :
          (p.result && typeof p.result.isFoul === "boolean" ? p.result.isFoul : false);
        
        let headResult = '-'; 
        let middleResult = '-';
        let tailResult = '-';

        if (!isFoul) { 
             // TODO: implement per-hand result display based on backend response
        }

        return { name: p.name, head, middle, tail, score, isFoul, headResult, middleResult, tailResult };
      });

       resultPlayers.sort((a, b) => b.score - a.score);

      setResultModalData(resultPlayers);
      setShowResult(true);
    }
  }

  async function handleExitRoom() {
    const token = localStorage.getItem('token');
    await apiFetch('https://9526.ip-ddns.com/api/leave_room.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, token }),
    });
    navigate('/');
  }

  // 开始新一局的函数
  async function handleNewRound() {
    setShowResult(false);
    await apiFetch('https://9526.ip-ddns.com/api/reset_after_result.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, token: localStorage.getItem('token') }),
    });

    setMyCards([]);
    setHead([]);
    setMiddle([]);
    setTail([]);
    setSelected({ area: '', cards: [] });
    setSubmitMsg('');
    setSubmitted(false);
    setIsReady(false);
    setAllPlayed(false);
    setResultModalData(null);
    setHasShownResult(false);
    setDraggingCard(null);
    setIsDraggingOver(null);
    setTimeLeft(0);

    fetchPlayers();
  }


  async function handleReady() {
    if (!isReady || submitted || roomStatus !== 'waiting') return; 
    const token = localStorage.getItem('token');
    await apiFetch('https://9526.ip-ddns.com/api/ready.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, token }),
    });
    setIsReady(false); 
  }

  // 智能分牌：调用前端算法 simpleAI
  function handleSmartSplit() {
      if (submitted || roomStatus !== 'playing' || myCards.length !== 13) return; 

      const arrangedHands = simpleAI(myCards); 

      setHead(arrangedHands.front);
      setMiddle(arrangedHands.middle);
      setTail(arrangedHands.back);
      setMyCards([]); 
      setSelected({ area: '', cards: [] }); 
      setSubmitMsg('已使用智能分牌');
  }

    // 处理拖拽开始事件
    function handleDragStart(e, card, area) {
        if (submitted || roomStatus !== 'playing') return; 

        let cardsToDrag = [];
        if (selected.area === area && selected.cards.some(selectedCard => selectedCard.suit === card.suit && selectedCard.rank === card.rank) && selected.cards.length > 0) {
            cardsToDrag = selected.cards;
        } else {
             cardsToDrag = [card];
        }

        if (cardsToDrag.length === 0) return; 

        e.dataTransfer.setData('cardsToMove', JSON.stringify(cardsToDrag));
        e.dataTransfer.setData('sourceArea', area); 

        setDraggingCard({ cards: cardsToDrag, area: area });
        setSelected({ area: '', cards: [] });
    }

    // 处理拖拽进入事件
    function handleDragEnter(e, area) {
        e.preventDefault();
        if (submitted || roomStatus !== 'playing') return; 
         setIsDraggingOver(area); 
    }

    // 处理拖拽经过事件
    function handleDragOver(e) {
        e.preventDefault(); 
        if (submitted || roomStatus !== 'playing') return; 
    }

    // 处理拖拽离开事件
    function handleDragLeave(e) {
        e.preventDefault();
        if (submitted || roomStatus !== 'playing') return; 
        setIsDraggingOver(null); 
    }

    // 处理放置事件
    function handleDrop(e, targetArea) {
        e.preventDefault(); 
        if (submitted || roomStatus !== 'playing') return; 

        const cardsToMoveData = e.dataTransfer.getData('cardsToMove');
        const sourceArea = e.dataTransfer.getData('sourceArea');

        setDraggingCard(null);
        setIsDraggingOver(null);

        if (!cardsToMoveData || !sourceArea) return; 

        const cardsToMove = JSON.parse(cardsToMoveData);

        if (cardsToMove.length === 0) return; 

        let sourceHand = [];
        if (sourceArea === 'hand') sourceHand = myCards;
        else if (sourceArea === 'head') sourceHand = head;
        else if (sourceArea === 'middle') sourceHand = middle;
        else if (sourceArea === 'tail') sourceHand = tail;

        let destHand = [];
        if (targetArea === 'head') destHand = head;
        else if (targetArea === 'middle') destHand = middle;
        else if (targetArea === 'tail') destHand = tail;

        // 检查目标墩是否会超限
        if (targetArea === 'head' && destHand.length + cardsToMove.length > 3) {
            setSubmitMsg('头墩最多只能放3张牌');
            return;
        }
         if ((targetArea === 'middle' || targetArea === 'tail') && destHand.length + cardsToMove.length > 5) {
             setSubmitMsg('中墩和尾墩最多只能放5张牌');
             return;
         }

        // 检查牌是否已经在目标墩 
        const alreadyInDest = cardsToMove.some(cardToMove => 
            destHand.some(destCard => 
                destCard.suit === cardToMove.suit && destCard.rank === cardToMove.rank
            )
        );

        if(alreadyInDest) {
             setSubmitMsg('部分或全部牌已经在这里了');
             return;
        }

        // 从原区域移除牌
        const newSourceHand = sourceHand.filter(card => 
            !cardsToMove.some(cardToMove => 
                 cardToMove.suit === card.suit && cardToMove.rank === card.rank
            )
        );

        // 添加到目标区域
        const newDestHand = [...destHand, ...cardsToMove];

        // 更新状态
        if (sourceArea === 'hand') setMyCards(newSourceHand);
        else if (sourceArea === 'head') setHead(newSourceHand);
        else if (sourceArea === 'middle') setMiddle(newSourceHand);
        else if (sourceArea === 'tail') setTail(newDestHand);

        if (targetArea === 'head') setHead(newDestHand);
        else if (targetArea === 'middle') setMiddle(newDestHand);
        else if (targetArea === 'tail') setTail(newDestHand);

        setSelected({ area: '', cards: [] }); 
        setSubmitMsg(''); 
    }

  function handleCardClick(card, area, e) {
    if (submitted || roomStatus !== 'playing') return; 
    if (e) e.stopPropagation();
    setSelected(sel => {
      if (sel.area !== area) return { area, cards: [card] };
      const isSelected = sel.cards.some(selectedCard => selectedCard.suit === card.suit && selectedCard.rank === card.rank);
      if (isSelected) {
          return { area, cards: sel.cards.filter(selectedCard => !(selectedCard.suit === card.suit && selectedCard.rank === card.rank)) };
      } else {
           return { area, cards: [...sel.cards, card] };
      }
    });
  }

  function moveTo(dest) {
    if (submitted || roomStatus !== 'playing') return; 
    if (!selected.cards.length) return;

    let currentDestHand = [];
    if (dest === 'head') currentDestHand = head;
    else if (dest === 'middle') currentDestHand = middle;
    else if (dest === 'tail') currentDestHand = tail;

    // 检查目标墩是否会超限
    if (dest === 'head' && currentDestHand.length + selected.cards.length > 3) {
        setSubmitMsg('头墩最多只能放3张牌');
        return;
    }
     if ((dest === 'middle' || dest === 'tail') && currentDestHand.length + selected.cards.length > 5) {
         setSubmitMsg('中墩和尾墩最多只能放5张牌');
         return;
     }

    let newHand = [...myCards];
    let newHead = [...head];
    let newMiddle = [...middle];
    let newTail = [...tail];
    const from = selected.area;

    if (from === 'hand') newHand = newHand.filter(c => !selected.cards.some(selCard => selCard.suit === c.suit && selCard.rank === c.rank));
    if (from === 'head') newHead = newHead.filter(c => !selected.cards.some(selCard => selCard.suit === c.suit && selCard.rank === c.rank));
    if (from === 'middle') newMiddle = newMiddle.filter(c => !selected.cards.some(selCard => selCard.suit === c.suit && selCard.rank === c.rank));
    if (from === 'tail') newTail = newTail.filter(c => !selected.cards.some(selCard => selCard.suit === c.suit && selCard.rank === c.rank));

    if (dest === 'hand') newHand = [...newHand, ...selected.cards];
    if (dest === 'head') newHead = [...newHead, ...selected.cards];
    if (dest === 'middle') newMiddle = [...newMiddle, ...selected.cards];
    if (dest === 'tail') newTail = [...newTail, ...selected.cards];

    setMyCards(newHand);
    setHead(newHead);
    setMiddle(newMiddle);
    setTail(newTail);
    setSelected({ area: dest, cards: [] });
    setSubmitMsg('');
  }

  async function handleStartCompare() {
    if (submitted || roomStatus !== 'playing') return; 
    if (head.length !== 3 || middle.length !== 5 || tail.length !== 5) {
      setSubmitMsg('请按 3-5-5 张牌分配');
      return;
    }

    const isFoul = compareHands(tail, middle) < 0 || compareHands(middle, head) < 0;

    if (isFoul) {
        setSubmitMsg('倒水！请重新分牌');
        return;
    }

    const cards = [...head, ...middle, ...tail]; 
    const token = localStorage.getItem('token');
    const data = await apiFetch('https://9526.ip-ddns.com/api/play.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, token, cards }),
    });
    if (data.success) {
      setSubmitted(true);
      setSubmitMsg('已提交，等待其他玩家...');
    } else {
      setSubmitMsg('提交失败，请重试');
    }
  }

    // 根据牌墩获取牌型名称
    function getHandTypeName(hand) {
        if (hand.length === 0) return '';
        if (hand.length === 3) {
            if (isThreeOfAKind(hand)) return '三条';
            if (isPair(hand)) return '对子'; 
             return '散牌'; 
        } else if (hand.length === 5) {
             if (isFiveOfAKind(hand)) return '五同';
            if (isStraightFlush(hand)) return '同花顺';
            if (isFourOfAKind(hand)) return '四条';
            if (isFullHouse(hand)) return '葫芦';
            if (isFlush(hand)) return '同花';
            if (isStraight(hand)) return '顺子';
            if (isTwoPair(hand)) return '两对';
            if (isThreeOfAKind(hand)) return '三条'; 
             if (isPair(hand)) return '对子'; 
             return '散牌'; 
        }
        return ''; 
    }

  // ========== UI渲染部分 ========== 

  function renderPlayerSeat(name, idx, isMe, submitted) {
    let statusText = submitted ? '已提交' : '未提交'; 
    let statusColor = submitted ? '#23e67a' : '#fff';
    
    if (roomStatus === 'waiting') {
        const player = players.find(p => p.name === name);
        statusText = player && player.isReady ? '已准备' : '未准备';
        statusColor = player && player.isReady ? '#23e67a' : '#fff';
    }

    return (
      <div
        key={name}
        className="play-seat"
        style={{
          marginRight: 8,
          width: '22%',
          minWidth: 70,
          color: isMe ? '#23e67a' : '#fff',
          background: isMe ? '#1c6e41' : '#2a556e',
          textAlign: 'center',
          padding: '12px 0',
          fontWeight: 700,
          fontSize: 17,
          boxSizing: 'border-box'
        }}
      >
        <div>{name}</div>
        <div style={{
          marginTop: 4,
          fontSize: 13,
          fontWeight: 600,
          color: isMe ? (submitted ? '#23e67a' : '#fff') : statusColor,
          letterSpacing: '1px'
        }}>
          {isMe ? '你' : statusText}
        </div>
      </div>
    );
  }

  function renderPaiDunCards(arr, area, cardSize) {
    const paddingX = 16;
    const maxWidth = OUTER_MAX_WIDTH - 2 * paddingX - 70;
    let overlap = Math.floor((cardSize?.width ?? CARD_WIDTH) / 3);
    if (arr.length > 1) {
      const totalWidth = (cardSize?.width ?? CARD_WIDTH) + (arr.length - 1) * overlap;
      if (totalWidth > maxWidth) {
        overlap = Math.floor((maxWidth - (cardSize?.width ?? CARD_WIDTH)) / (arr.length - 1));
      }
    }
    let lefts = [];
    let startX = 0;
    for (let i = 0; i < arr.length; ++i) {
      lefts.push(startX + i * overlap);
    }

    // 在非playing状态或已提交后显示牌面
    const showCardFace = roomStatus !== 'playing' || submitted; 

    return (
      <div style={{
        position: 'relative',
        height: cardSize?.height ?? PAI_DUN_HEIGHT,
        width: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        overflow: 'visible'
      }}>
        {arr.map((card, idx) => {
          const isSelected = selected.area === area && selected.cards.some(selectedCard => selectedCard.suit === card.suit && selectedCard.rank === card.rank); 
          return (
            <img
              key={card.suit + card.rank} 
              src={showCardFace ? `/cards/${card.rank}_of_${card.suit}.svg` : '/cards/back.svg'} 
              alt={showCardFace ? card.rank + ' of ' + card.suit : '牌背'}
              className={`card-img ${draggingCard && draggingCard.area === area && draggingCard.cards.some(dragCard => dragCard.suit === card.suit && dragCard.rank === card.rank) ? 'dragging' : ''}`} 
              style={{
                position: 'absolute',
                left: lefts[idx],
                top: ((cardSize?.height ?? PAI_DUN_HEIGHT) - (cardSize?.height ?? CARD_HEIGHT)) / 2,
                zIndex: idx,
                width: cardSize?.width ?? CARD_WIDTH,
                height: cardSize?.height ?? CARD_HEIGHT,
                borderRadius: 5,
                border: isSelected ? '2.5px solid #ff4444' : 'none',
                boxShadow: isSelected
                  ? '0 0 16px 2px #ff4444cc'
                  : "0 4px 22px #23e67a44, 0 1.5px 5px #1a462a6a", /* 修正：移除了错误的逗号 */
                cursor: (submitted || roomStatus !== 'playing') ? 'not-allowed' : 'pointer', 
                background: '#185a30',
                transition: 'border .13s, box-shadow .13s'
              }}
              draggable={!submitted && roomStatus === 'playing'} 
              onDragStart={(e) => { if (!submitted && roomStatus === 'playing') handleDragStart(e, card, area); }} 
              onClick={e => { if (!submitted && roomStatus === 'playing') handleCardClick(card, area, e); }}n