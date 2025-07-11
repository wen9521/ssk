import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// 空模块 - 后续实现
const aiSmartSplit = () => ({});
const getPlayerSmartSplits = () => [];
const calcSSSAllScores = () => [];
const getShuffledDeck = () => [];
const dealHands = () => [];
const isFoul = () => false;

const AI_NAMES = ['小明', '小红', '小刚'];

const OUTER_MAX_WIDTH = 420;
const PAI_DUN_HEIGHT = 133;
const CARD_HEIGHT = Math.round(PAI_DUN_HEIGHT * 0.94);
const CARD_WIDTH = Math.round(CARD_HEIGHT * 46 / 66);

export default function ThirteenWater() {
  const navigate = useNavigate();
  const [head, setHead] = useState([]);
  const [middle, setMiddle] = useState([]);
  const [tail, setTail] = useState([]);
  const [selected, setSelected] = useState({ area: '', cards: [] });
  const [msg, setMsg] = useState('');
  const [aiPlayers, setAiPlayers] = useState([
    { name: AI_NAMES[0], isAI: true, cards13: [], head: [], middle: [], tail: [], processed: false },
    { name: AI_NAMES[1], isAI: true, cards13: [], head: [], middle: [], tail: [], processed: false },
    { name: AI_NAMES[2], isAI: true, cards13: [], head: [], middle: [], tail: [], processed: false },
  ]);
  const [showResult, setShowResult] = useState(false);
  const [scores, setScores] = useState([0,0,0,0]);
  const [isReady, setIsReady] = useState(false);
  const [hasCompared, setHasCompared] = useState(false);
  const [foulStates, setFoulStates] = useState([false, false, false, false]);
  const [mySplits, setMySplits] = useState([]);
  const [splitIndex, setSplitIndex] = useState(0);
  const [aiProcessed, setAiProcessed] = useState([false, false, false]);

  function handleReady() {
    if (!isReady) {
      // 发牌功能占位 - 后续实现
      const deck = getShuffledDeck();
      const [myHand, ...aiHands] = dealHands(deck);
      
      setHead(myHand.slice(0, 3));
      setMiddle(myHand.slice(3, 8));
      setTail(myHand.slice(8, 13));
      setIsReady(true);
      setHasCompared(false);
      setMsg('发牌完成，请理牌');
      setShowResult(false);
      setScores([0,0,0,0]);
      setSelected({ area: '', cards: [] });
      setFoulStates([false, false, false, false]);
      setMySplits([]); 
      setSplitIndex(0);
      setAiProcessed([false, false, false]);
      
      setAiPlayers([
        { name: AI_NAMES[0], isAI: true, cards13: aiHands[0], head: aiHands[0].slice(0,3), middle: aiHands[0].slice(3,8), tail: aiHands[0].slice(8,13), processed: false },
        { name: AI_NAMES[1], isAI: true, cards13: aiHands[1], head: aiHands[1].slice(0,3), middle: aiHands[1].slice(3,8), tail: aiHands[1].slice(8,13), processed: false },
        { name: AI_NAMES[2], isAI: true, cards13: aiHands[2], head: aiHands[2].slice(0,3), middle: aiHands[2].slice(3,8), tail: aiHands[2].slice(8,13), processed: false },
      ]);
      
      // 智能分牌占位 - 后续实现
      setTimeout(() => {
        const splits = getPlayerSmartSplits(myHand);
        setMySplits(splits);
        setSplitIndex(0);
      }, 0);

      // AI理牌占位 - 后续实现
      aiHands.forEach((hand, idx) => {
        setTimeout(() => {
          setAiPlayers(old => {
            const newAis = [...old];
            const split = aiSmartSplit(hand);
            newAis[idx] = { ...newAis[idx], ...split, processed: true };
            return newAis;
          });
          setAiProcessed(proc => {
            const arr = [...proc];
            arr[idx] = true;
            return arr;
          });
        }, 400 + idx * 350);
      });
    } else {
      // 取消准备
      setHead([]); 
      setMiddle([]); 
      setTail([]);
      setAiPlayers([
        { name: AI_NAMES[0], isAI: true, cards13: [], head: [], middle: [], tail: [], processed: false },
        { name: AI_NAMES[1], isAI: true, cards13: [], head: [], middle: [], tail: [], processed: false },
        { name: AI_NAMES[2], isAI: true, cards13: [], head: [], middle: [], tail: [], processed: false },
      ]);
      setIsReady(false);
      setHasCompared(false);
      setMsg('已取消准备');
      setShowResult(false);
      setScores([0,0,0,0]);
      setSelected({ area: '', cards: [] });
      setFoulStates([false, false, false, false]);
      setMySplits([]); 
      setSplitIndex(0);
      setAiProcessed([false, false, false]);
    }
  }

  function handleCardClick(card, area, e) {
    e.stopPropagation();
    setSelected(prev => {
      if (prev.area !== area) return { area, cards: [card] };
      const isSelected = prev.cards.includes(card);
      let nextCards;
      if (isSelected) {
        nextCards = prev.cards.filter(c => c !== card);
      } else {
        nextCards = [...prev.cards, card];
      }
      return { area, cards: nextCards };
    });
  }

  function moveTo(dest) {
    if (!selected.cards.length) return;
    let newHead = [...head], newMiddle = [...middle], newTail = [...tail];
    const from = selected.area;
    if (from === 'head') newHead = newHead.filter(c => !selected.cards.includes(c));
    if (from === 'middle') newMiddle = newMiddle.filter(c => !selected.cards.includes(c));
    if (from === 'tail') newTail = newTail.filter(c => !selected.cards.includes(c));
    if (dest === 'head') newHead = [...newHead, ...selected.cards];
    if (dest === 'middle') newMiddle = [...newMiddle, ...selected.cards];
    if (dest === 'tail') newTail = [...newTail, ...selected.cards];
    setHead(newHead); 
    setMiddle(newMiddle); 
    setTail(newTail);
    setSelected({ area: dest, cards: [] });
    setMsg('');
  }

  function handleSmartSplit() {
    if (!mySplits.length) {
      setMsg('智能分牌计算中，请稍候…');
      return;
    }
    const nextIdx = (splitIndex + 1) % mySplits.length;
    setSplitIndex(nextIdx);
    const split = mySplits[nextIdx];
    setHead(split.head);
    setMiddle(split.middle);
    setTail(split.tail);
    setMsg(`已切换智能分牌方案 ${nextIdx + 1}/${mySplits.length}`);
  }

  function handleStartCompare() {
    if (aiProcessed.some(p => !p)) {
      setMsg('请等待所有玩家提交理牌');
      return;
    }
    if (head.length !== 3 || middle.length !== 5 || tail.length !== 5) {
      setMsg('请按 3-5-5 张分配');
      return;
    }
    
    // 比牌功能占位 - 后续实现
    const allPlayers = [
      { name: '你', head, middle, tail },
      ...aiPlayers.map(ai => ({ name: ai.name, head: ai.head, middle: ai.middle, tail: ai.tail }))
    ];
    const resScores = calcSSSAllScores(allPlayers);
    const fouls = allPlayers.map(p => isFoul(p.head, p.middle, p.tail));
    
    setScores(resScores);
    setFoulStates(fouls);
    setShowResult(true);
    setHasCompared(true);
    setMsg('');
    setIsReady(false);
  }

  function renderPlayerSeat(name, idx, isMe) {
    const aiDone = idx > 0 ? aiProcessed[idx - 1] : false;
    return (
      <div
        key={name}
        className="play-seat"
        style={{
          border: '1px solid #1a6d3b',
          borderRadius: 12,
          marginRight: 8,
          width: '22%',
          minWidth: 70,
          color: isMe ? '#fff' : (aiDone ? '#fff' : '#ccc'),
          background: isMe ? '#1a6d3b' : '#2a556e',
          textAlign: 'center',
          padding: '10px 0',
          fontWeight: 700,
          fontSize: 16,
          boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
          transition: 'all 0.3s',
          opacity: aiDone ? 1 : 0.8
        }}
      >
        <div style={{ fontSize: 18, marginBottom: 4 }}>{name}</div>
        <div style={{ fontSize: 14, fontWeight: 400 }}>
          {isMe ? '你' : (aiDone ? '已准备' : '准备中…')}
        </div>
      </div>
    );
  }

  function renderCard(card, isSelected, onClick) {
    return (
      <div 
        key={card}
        className={`card ${isSelected ? 'selected' : ''}`}
        onClick={onClick}
        style={{
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          borderRadius: 8,
          background: '#fff',
          boxShadow: isSelected 
            ? '0 0 0 3px #ffcc00, 0 4px 12px rgba(0,0,0,0.2)' 
            : '0 2px 6px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 8,
          margin: '0 2px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ 
          fontSize: 20, 
          fontWeight: 'bold', 
          color: '#e74c3c',
          textAlign: 'left'
        }}>
          {card.split('_')[0]}
        </div>
        <div style={{ 
          fontSize: 28, 
          fontWeight: 'bold', 
          color: '#2c3e50',
          textAlign: 'center',
          marginTop: -10
        }}>
          {card.includes('hearts') ? '♥' : 
           card.includes('diamonds') ? '♦' : 
           card.includes('clubs') ? '♣' : '♠'}
        </div>
        <div style={{ 
          fontSize: 20, 
          fontWeight: 'bold', 
          color: '#e74c3c',
          textAlign: 'right',
          transform: 'rotate(180deg)'
        }}>
          {card.split('_')[0]}
        </div>
      </div>
    );
  }

  function renderPaiDunCards(arr, area) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 5,
        minHeight: CARD_HEIGHT + 20,
        alignItems: 'center'
      }}>
        {arr.length === 0 ? (
          <div style={{
            color: '#a3c6b3',
            fontSize: 16,
            fontStyle: 'italic'
          }}>
            点击放置牌
          </div>
        ) : (
          arr.map((card, idx) => {
            const isSelected = selected.area === area && selected.cards.includes(card);
            return renderCard(
              card, 
              isSelected, 
              (e) => isReady && handleCardClick(card, area, e)
            );
          })
        )}
      </div>
    );
  }

  function renderPaiDun(arr, label, area) {
    return (
      <div
        className="pai-dun-container"
        style={{
          width: '100%',
          borderRadius: 16,
          background: 'rgba(26, 109, 59, 0.7)',
          minHeight: 150,
          marginBottom: 20,
          position: 'relative',
          boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
          padding: 20,
          border: '2px solid #1a6d3b'
        }}
        onClick={() => isReady && moveTo(area)}
      >
        <div style={{
          position: 'absolute',
          top: 10,
          left: 15,
          color: '#ffcc00',
          fontSize: 18,
          fontWeight: 700,
          background: 'rgba(0,0,0,0.3)',
          padding: '4px 12px',
          borderRadius: 20
        }}>
          {label}墩
          <span style={{ marginLeft: 8, color: '#fff' }}>({arr.length}张)</span>
        </div>
        {renderPaiDunCards(arr, area)}
      </div>
    );
  }

  function renderResultModal() {
    if (!showResult) return null;
    
    return (
      <div style={{
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh',
        background: 'rgba(0,0,0,0.8)', 
        zIndex: 1000, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backdropFilter: 'blur(5px)'
      }}>
        <div style={{
          background: 'linear-gradient(145deg, #1a6d3b, #0d4d2b)',
          borderRadius: 20,
          padding: 25,
          width: '90%',
          maxWidth: 500,
          boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
          border: '2px solid #ffcc00',
          position: 'relative'
        }}>
          <h2 style={{
            textAlign: 'center',
            color: '#ffcc00',
            marginBottom: 20,
            fontSize: 24,
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            比牌结果
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 20
          }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 12,
                padding: 15,
                border: i === 0 ? '2px solid #ffcc00' : '1px solid #2a556e'
              }}>
                <div style={{ 
                  fontWeight: 700, 
                  color: i === 0 ? '#ffcc00' : '#4f8cff', 
                  marginBottom: 10,
                  fontSize: 18,
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <span style={{ flex: 1 }}>
                    {i === 0 ? '你' : aiPlayers[i - 1].name}
                  </span>
                  <span style={{ 
                    background: foulStates[i] ? '#e74c3c' : '#2ecc71',
                    color: '#fff',
                    fontSize: 12,
                    padding: '2px 8px',
                    borderRadius: 10,
                    marginLeft: 8
                  }}>
                    {foulStates[i] ? '倒水' : '正常'}
                  </span>
                </div>
                
                <div style={{ 
                  fontSize: 18, 
                  fontWeight: 700,
                  color: '#ffcc00',
                  textAlign: 'center',
                  margin: '10px 0'
                }}>
                  {scores[i]} 分
                </div>
                
                <div style={{ marginBottom: 8 }}>
                  <div style={{ color: '#ffcc00', marginBottom: 5 }}>头道:</div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 3 }}>
                    {i === 0
                      ? head.map(card => renderCard(card, false, null))
                      : aiPlayers[i - 1].head.map(card => renderCard(card, false, null))}
                  </div>
                </div>
                
                <div style={{ marginBottom: 8 }}>
                  <div style={{ color: '#ffcc00', marginBottom: 5 }}>中道:</div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap' }}>
                    {i === 0
                      ? middle.map(card => renderCard(card, false, null))
                      : aiPlayers[i - 1].middle.map(card => renderCard(card, false, null))}
                  </div>
                </div>
                
                <div>
                  <div style={{ color: '#ffcc00', marginBottom: 5 }}>尾道:</div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap' }}>
                    {i === 0
                      ? tail.map(card => renderCard(card, false, null))
                      : aiPlayers[i - 1].tail.map(card => renderCard(card, false, null))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <button 
            onClick={() => setShowResult(false)}
            style={{
              position: 'absolute',
              top: 15,
              right: 15,
              background: 'transparent',
              border: 'none',
              fontSize: 24,
              color: '#ffcc00',
              cursor: 'pointer',
              width: 40,
              height: 40,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0d4d2b 0%, #1a6d3b 100%)',
      minHeight: '100vh',
      fontFamily: '"Helvetica Neue", Arial, sans-serif',
      padding: '20px 0'
    }}>
      <div style={{
        maxWidth: OUTER_MAX_WIDTH,
        width: '100%',
        margin: '0 auto',
        background: 'rgba(26, 109, 59, 0.85)',
        borderRadius: 25,
        boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
        padding: 20,
        border: '2px solid #ffcc00',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '90vh',
        boxSizing: 'border-box'
      }}>
        {/* 顶部：标题和退出按钮 */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: 20,
          borderBottom: '2px solid #ffcc00',
          paddingBottom: 15
        }}>
          <h1 style={{
            color: '#ffcc00',
            fontSize: 24,
            margin: 0,
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            十三水游戏
          </h1>
          
          <button
            style={{
              background: 'linear-gradient(90deg, #e74c3c, #c0392b)',
              color: '#fff',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: 8,
              padding: '8px 15px',
              cursor: 'pointer',
              fontSize: 16,
              boxShadow: '0 3px 8px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center'
            }}
            onClick={() => navigate('/')}
          >
            <span style={{ marginRight: 5 }}>←</span> 返回大厅
          </button>
        </div>
        
        {/* 玩家区 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginBottom: 25,
          gap: 10
        }}>
          {renderPlayerSeat('你', 0, true)}
          {aiPlayers.map((ai, idx) => renderPlayerSeat(ai.name, idx + 1, false))}
        </div>
        
        {/* 牌墩区域 */}
        <div style={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 15,
          marginBottom: 25
        }}>
          {renderPaiDun(head, '头')}
          {renderPaiDun(middle, '中')}
          {renderPaiDun(tail, '尾')}
        </div>
        
        {/* 按钮区 */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr 1fr', 
          gap: 12,
          marginTop: 'auto'
        }}>
          <button
            className="game-btn"
            style={{
              background: !isReady
                ? 'linear-gradient(90deg, #2ecc71, #27ae60)'
                : '#95a5a6',
            }}
            onClick={handleReady}
          >
            {isReady ? '取消准备' : '开始准备'}
          </button>
          
          <button
            className="game-btn"
            style={{
              background: 'linear-gradient(90deg, #3498db, #2980b9)',
              opacity: isReady ? 1 : 0.6
            }}
            onClick={handleSmartSplit}
            disabled={!isReady}
          >
            智能分牌
          </button>
          
          <button
            className="game-btn"
            style={{
              background: isReady && aiProcessed.every(x => x)
                ? 'linear-gradient(90deg, #f39c12, #e67e22)'
                : '#95a5a6',
            }}
            onClick={isReady ? handleStartCompare : undefined}
            disabled={!isReady || !aiProcessed.every(x => x)}
          >
            开始比牌
          </button>
        </div>
        
        {/* 消息区域 */}
        <div style={{ 
          color: '#ffcc00', 
          textAlign: 'center', 
          fontSize: 16, 
          minHeight: 24,
          marginTop: 15,
          fontWeight: 500
        }}>
          {msg || '等待操作...'}
        </div>
        
        {renderResultModal()}
      </div>
    </div>
  );
}