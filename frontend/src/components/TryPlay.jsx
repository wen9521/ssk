import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiSmartSplit, getPlayerSmartSplits } from './SmartSplit';
import { calcSSSAllScores } from './sssScore';
import { getShuffledDeck, dealHands } from './DealCards';
import './TryPlay.css';
import { isFoul } from './sssScore';

const AI_NAMES = ['小明', '小红', '小刚'];

const OUTER_MAX_WIDTH = 420;
const PAI_DUN_HEIGHT = 133;
const CARD_HEIGHT = Math.round(PAI_DUN_HEIGHT * 0.94);
const CARD_WIDTH = Math.round(CARD_HEIGHT * 46 / 66);

export default function TryPlay() {
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
      setTimeout(() => {
        const splits = getPlayerSmartSplits(myHand);
        setMySplits(splits);
        setSplitIndex(0);
      }, 0);
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
        className={`tryplay-seat${isMe ? ' me' : ''}${aiDone ? ' done' : ''}`}
      >
        <div>{name}</div>
        <div className="tryplay-seat-status">
          {isMe ? '你' : (aiDone ? '已理牌' : '理牌中…')}
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
    return (
      <div className="tryplay-pai-dun-cards" style={{
        height: cardSize?.height ?? PAI_DUN_HEIGHT,
        width: '100%',
      }}>
        {arr.map((card, idx) => {
          const isSelected = selected.area === area && selected.cards.includes(card);
          return (
            <img
              key={card}
              src={`/cards/${card}.svg`}
              alt={card}
              className={`tryplay-card-img${isSelected ? ' selected' : ''}`}
              style={{
                left: lefts[idx],
                width: cardSize?.width ?? CARD_WIDTH,
                height: cardSize?.height ?? CARD_HEIGHT,
              }}
              onClick={e => { if (isReady) handleCardClick(card, area, e); }}
              draggable={false}
            />
          );
        })}
      </div>
    );
  }

  function renderPaiDun(arr, label, area, color) {
    return (
      <div className="tryplay-pai-dun" onClick={() => { if (isReady) moveTo(area); }}>
        <div className="tryplay-pai-dun-inner">
          {arr.length === 0 &&
            <div className="tryplay-pai-dun-placeholder">
              请放置
            </div>
          }
          {renderPaiDunCards(arr, area)}
        </div>
        <div className="tryplay-pai-dun-label" style={{ color }}>
          {label}（{arr.length}）
        </div>
      </div>
    );
  }

  function renderResultModal() {
    if (!showResult) return null;
    const scale = 0.9;
    const cardW = CARD_WIDTH * scale;
    const cardH = CARD_HEIGHT * scale;
    return (
      <div className="tryplay-result-modal-bg">
        <div className="tryplay-result-modal">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="tryplay-result-player">
              <div className="tryplay-result-name" style={{ color: i === 0 ? '#23e67a' : '#4f8cff' }}>
                {i === 0 ? '你' : aiPlayers[i - 1].name}
                {foulStates[i] && (
                  <span className="tryplay-result-foul">（倒水）</span>
                )}
                （{scores[i]}分）
              </div>
              <div className="tryplay-result-cards-row">
                {i === 0
                  ? renderPaiDunCards(head, 'none', { width: cardW, height: cardH })
                  : renderPaiDunCards(aiPlayers[i - 1].head, 'none', { width: cardW, height: cardH })}
              </div>
              <div className="tryplay-result-cards-row">
                {i === 0
                  ? renderPaiDunCards(middle, 'none', { width: cardW, height: cardH })
                  : renderPaiDunCards(aiPlayers[i - 1].middle, 'none', { width: cardW, height: cardH })}
              </div>
              <div className="tryplay-result-cards-row">
                {i === 0
                  ? renderPaiDunCards(tail, 'none', { width: cardW, height: cardH })
                  : renderPaiDunCards(aiPlayers[i - 1].tail, 'none', { width: cardW, height: cardH })}
              </div>
            </div>
          ))}
          <button className="tryplay-result-modal-close" onClick={() => setShowResult(false)}>×</button>
        </div>
      </div>
    );
  }

  return (
    <div className="tryplay-bg">
      <div className="tryplay-mainbox">
        <div className="tryplay-header">
          <button className="tryplay-exit-btn" onClick={() => navigate('/')}>
            &lt; 退出房间
          </button>
          <div className="tryplay-score">
            <span role="img" aria-label="coin" style={{ fontSize: 18, marginRight: 4 }}>🪙</span>
            积分：100
          </div>
        </div>
        <div className="tryplay-player-row">
          {renderPlayerSeat('你', 0, true)}
          {aiPlayers.map((ai, idx) => renderPlayerSeat(ai.name, idx + 1, false))}
        </div>
        {renderPaiDun(head, '头道', 'head', '#23e67a')}
        {renderPaiDun(middle, '中道', 'middle', '#23e67a')}
        {renderPaiDun(tail, '尾道', 'tail', '#23e67a')}
        <div className="tryplay-btn-row">
          <button
            className={`tryplay-btn${!isReady ? ' ready' : ' notready'}`}
            onClick={handleReady}
          >{isReady ? '取消准备' : '准备'}</button>
          <button
            className="tryplay-btn smart"
            onClick={handleSmartSplit}
            disabled={!isReady}
          >智能分牌</button>
          <button
            className={`tryplay-btn compare${isReady && aiProcessed.every(x=>x) ? '' : ' disabled'}`}
            onClick={isReady ? handleStartCompare : undefined}
            disabled={!isReady || aiProcessed.some(p=>!p)}
          >开始比牌</button>
        </div>
        <div className="tryplay-msg">
          {msg}
        </div>
        {renderResultModal()}
      </div>
    </div>
  );
}
