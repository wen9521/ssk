import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiSmartSplit, getPlayerSmartSplits } from '../SmartSplit';
import { calcSSSAllScores } from '../sssScore';
import { getShuffledDeck, dealHands } from '../DealCards';
import '../Play.css';
import { isFoul } from '../sssScore';

const AI_NAMES = ['小明', '小红', '小刚'];

const OUTER_MAX_WIDTH = 420;
const PAI_DUN_HEIGHT = 133;
const CARD_HEIGHT = Math.round(PAI_DUN_HEIGHT * 0.94);
const CARD_WIDTH = Math.round(CARD_HEIGHT * 46 / 66);

export default function Play() {
  const navigate = useNavigate();
  const [head, setHead] = useState([]);
  const [middle, setMiddle] = useState([]);
  const [tail, setTail] = useState([]);
  const [selected, setSelected] = useState({ area: '', cards: [] });
  const [msg, setMsg] = useState('');
  // aiPlayers增加processed字段
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

  // 我的智能分法缓存
  const [mySplits, setMySplits] = useState([]);
  const [splitIndex, setSplitIndex] = useState(0);

  // AI理牌进度
  const [aiProcessed, setAiProcessed] = useState([false, false, false]);

  function handleReady() {
    if (!isReady) {
      // 发牌
      const deck = getShuffledDeck();
      const [myHand, ...aiHands] = dealHands(deck);
      setHead(myHand.slice(0, 3));
      setMiddle(myHand.slice(3, 8));
      setTail(myHand.slice(8, 13));
      setIsReady(true);
      setHasCompared(false);
      setMsg('');
      setShowResult(false);
      setScores([0,0,0,0]);
      setSelected({ area: '', cards: [] });
      setFoulStates([false, false, false, false]);
      setMySplits([]); setSplitIndex(0);
      setAiProcessed([false, false, false]);
      setAiPlayers([
        { name: AI_NAMES[0], isAI: true, cards13: aiHands[0], head: aiHands[0].slice(0,3), middle: aiHands[0].slice(3,8), tail: aiHands[0].slice(8,13), processed: false },
        { name: AI_NAMES[1], isAI: true, cards13: aiHands[1], head: aiHands[1].slice(0,3), middle: aiHands[1].slice(3,8), tail: aiHands[1].slice(8,13), processed: false },
        { name: AI_NAMES[2], isAI: true, cards13: aiHands[2], head: aiHands[2].slice(0,3), middle: aiHands[2].slice(3,8), tail: aiHands[2].slice(8,13), processed: false },
      ]);
      // 只缓存我的5分法
      setTimeout(() => {
        const splits = getPlayerSmartSplits(myHand);
        setMySplits(splits);
        setSplitIndex(0);
      }, 0);

      // 依次异步处理AI理牌
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
        }, 400 + idx * 350); // 小明最快，后两个延迟处理
      });
    } else {
      // 取消准备
      setHead([]); setMiddle([]); setTail([]);
      setAiPlayers([
        { name: AI_NAMES[0], isAI: true, cards13: [], head: [], middle: [], tail: [], processed: false },
        { name: AI_NAMES[1], isAI: true, cards13: [], head: [], middle: [], tail: [], processed: false },
        { name: AI_NAMES[2], isAI: true, cards13: [], head: [], middle: [], tail: [], processed: false },
      ]);
      setIsReady(false);
      setHasCompared(false);
      setMsg('');
      setShowResult(false);
      setScores([0,0,0,0]);
      setSelected({ area: '', cards: [] });
      setFoulStates([false, false, false, false]);
      setMySplits([]); setSplitIndex(0);
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
    setHead(newHead); setMiddle(newMiddle); setTail(newTail);
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
    const allPlayers = [
      { name: '你', head, middle, tail },
      ...aiPlayers.map(ai => ({ name: ai.name, head: ai.head, middle: ai.middle, tail: ai.tail }))
    ];
    // 比牌+倒水判定
    const resScores = calcSSSAllScores(allPlayers);
    // 计算倒水状态
    const fouls = allPlayers.map(p => isFoul(p.head, p.middle, p.tail));
    setScores(resScores);
    setFoulStates(fouls);
    setShowResult(true);
    setHasCompared(true);
    setMsg('');
    setIsReady(false);
  }

  function renderPlayerSeat(name, idx, isMe) {
    // 绿色表示理牌完成
    const aiDone = idx > 0 ? aiProcessed[idx - 1] : false;
    return (
      <div
        key={name}
        className={`play-seat ${isMe ? 'me' : ''} ${aiDone && !isMe ? 'ai-done' : ''}`}
      >
        <div>{name}</div>
        <div className="play-seat-status">
          {isMe ? '你' : (aiDone ? '已理牌' : '理牌中…')}
        </div>
      </div>
    );
  }

  function renderPaiDunCards(arr, area, cardSize) {
    const paddingX = 20; // 调整padding
    const maxWidth = OUTER_MAX_WIDTH - 2 * paddingX - 70;
    let overlap = Math.floor(CARD_WIDTH / 3); // 使用CARD_WIDTH常量

    if (arr.length > 1) {
      const totalWidth = CARD_WIDTH + (arr.length - 1) * overlap;
      if (totalWidth > maxWidth) {
        overlap = Math.floor((maxWidth - CARD_WIDTH) / (arr.length - 1));
      }
    }
    let lefts = [];
    let startX = 0;
    for (let i = 0; i < arr.length; ++i) {
      lefts.push(startX + i * overlap);
    }
    return (
      <div className="pai-dun-content-cards-wrapper">
        {arr.map((card, idx) => {
          const isSelected = selected.area === area && selected.cards.includes(card);
          return (
            <img
              key={card}
              src={`/cards/${card}.svg`}
              alt={card}
              className={`card-img ${isSelected ? 'selected' : ''}`}
              style={{
                left: lefts[idx],
                zIndex: idx,
                cursor: isReady ? 'pointer' : 'not-allowed',
                width: cardSize?.width,
                height: cardSize?.height,
              }}
              onClick={e => { if (isReady) handleCardClick(card, area, e); }}
              draggable={false}
            />
          );
        })}
      </div>
    );
  }

  function renderPaiDun(arr, label, area) {
    return (
      <div
        className="pai-dun-container"
        onClick={() => { if (isReady) moveTo(area); }}
      >
        <div className="pai-dun-content">
          {arr.length === 0 &&
            <div className="pai-dun-placeholder">
              请放置
            </div>
          }
          {renderPaiDunCards(arr, area)}
        </div>
        <div className="pai-dun-label">
          {label}（{arr.length}）
        </div>
      </div>
    );
  }

  function renderResultModal() {
    if (!showResult) return null;
    // 模态框内的牌尺寸也可以通过CSS变量调整
    const cardSize = { width: CARD_WIDTH * 0.7, height: CARD_HEIGHT * 0.7 }; // 缩小模态框内的牌

    return (
      <div className="result-modal-overlay">
        <div className="result-modal-content">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="result-player-section">
              <div className={"result-player-name " + (i === 0 ? 'me' : '')}>
                {i === 0 ? '你' : aiPlayers[i - 1].name}
                {foulStates[i] && (
                  <span className="foul-text">（倒水）</span>
                )}
                （{scores[i]}分）
              </div>
              <div className="result-cards-row">
                {i === 0
                  ? renderPaiDunCards(head, 'none', cardSize)
                  : renderPaiDunCards(aiPlayers[i - 1].head, 'none', cardSize)}
              </div>
              <div className="result-cards-row">
                {i === 0
                  ? renderPaiDunCards(middle, 'none', cardSize)
                  : renderPaiDunCards(aiPlayers[i - 1].middle, 'none', cardSize)}
              </div>
              <div className="result-cards-row">
                {i === 0
                  ? renderPaiDunCards(tail, 'none', cardSize)
                  : renderPaiDunCards(aiPlayers[i - 1].tail, 'none', cardSize)}
              </div>
            </div>
          ))}
          <button className="modal-close-button" onClick={() => setShowResult(false)}>×</button>
        </div>
      </div>
    );
  }

  return (
    <div className="play-container">
      <div className="play-inner-wrapper">
        {/* 头部：退出房间+积分 */} 
        <div className="header-controls">
          <button
            className="exit-button"
            onClick={() => navigate('/')}
          >
            &lt; 退出房间
          </button>
          <div className="score-display">
            <span role="img" aria-label="coin" className="score-icon">🪙</span>
            积分：100
          </div>
        </div>
        {/* 玩家区 */} 
        <div className="player-seats-container">
          {renderPlayerSeat('你', 0, true)}
          {aiPlayers.map((ai, idx) => renderPlayerSeat(ai.name, idx + 1, false))}
        </div>
        {/* 牌墩区域 */} 
        {renderPaiDun(head, '头道', 'head')}
        {renderPaiDun(middle, '中道', 'middle')}
        {renderPaiDun(tail, '尾道', 'tail')}
        {/* 按钮区 */} 
        <div className="buttons-container">
          <button
            className={`action-button ready-button ${isReady ? 'cancel' : ''}`}
            onClick={handleReady}
          >{isReady ? '取消准备' : '准备'}</button>
          <button
            className="action-button smart-split-button"
            onClick={handleSmartSplit}
            disabled={!isReady}
          >智能分牌</button>
          <button
            className={`action-button start-compare-button`}
            onClick={isReady ? handleStartCompare : undefined}
            disabled={!isReady || aiProcessed.some(p=>!p)}
          >开始比牌</button>
        </div>
        <div className="message-display">
          {msg}
        </div>
        {renderResultModal()}
      </div>
    </div>
  );
}

// 导出isFoul供外部引用（如有TreeShaking可忽略）
export { isFoul } from '../sssScore';
