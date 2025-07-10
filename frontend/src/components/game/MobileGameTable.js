import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiSmartSplit, getPlayerSmartSplits } from '../../utils/ai/SmartSplit';
import { calcSSSAllScores, isFoul } from '../../utils/game/sssScore';
import { getShuffledDeck, dealHands } from '../../utils/game/DealCards';
import Card from '../ui/Card'; // 导入 Card 组件
import '../../styles/MobileGameTable.css';

const AI_NAMES = ['小明', '小红', '小刚'];

export default function MobileGameTable() {
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
      setMySplits([]); 
      setSplitIndex(0);
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
      setMsg('');
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
      <div className={`player-seat ${isMe ? 'me' : ''} ${aiDone ? 'ready' : ''}`}>
        <div className="player-name">{name}</div>
        <div className="player-status">
          {isMe ? '你' : (aiDone ? '已理牌' : '理牌中…')}
        </div>
      </div>
    );
  }

  // 修复：使用 Card 组件显示扑克牌
  function renderPaiDunCards(arr, area) {
    return (
      <div className="dun-cards-container">
        {arr.map((card, idx) => {
          const isSelected = selected.area === area && selected.cards.includes(card);
          return (
            <Card 
              key={`${area}-${idx}`} 
              card={card}
              isSelected={isSelected}
              onCardClick={(e) => { 
                if (isReady) {
                  e.stopPropagation();
                  handleCardClick(card, area, e);
                }
              }}
            />
          );
        })}
      </div>
    );
  }

  function renderPaiDun(arr, label, area) {
    return (
      <div 
        className="dun-container"
        onClick={() => { if (isReady) moveTo(area); }}
      >
        <div className="dun-header">
          <div className="dun-label">{label}</div>
          <div className="dun-count">({arr.length}张)</div>
        </div>
        <div className="dun-content">
          {arr.length === 0 ? (
            <div className="dun-placeholder">请放置</div>
          ) : (
            renderPaiDunCards(arr, area)
          )}
        </div>
      </div>
    );
  }

  function renderResultModal() {
    if (!showResult) return null;
    
    return (
      <>
        <div className="result-modal-overlay">
          <div className="result-modal">
            <div className="result-grid">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="result-player-display">
                  <div className={`result-player-name ${i === 0 ? 'me' : 'ai'}`}>
                    {i === 0 ? '你' : aiPlayers[i - 1].name}
                    {foulStates[i] && (
                      <span className="foul-text">（倒水）</span>
                    )}
                    <span className="player-score">（{scores[i]}分）</span>
                  </div>
                  <div className="result-dun-row">
                    <div className="dun-label">头道</div>
                    {i === 0
                      ? renderPaiDunCards(head, 'head')
                      : renderPaiDunCards(aiPlayers[i - 1].head, 'head')}
                  </div>
                  <div className="result-dun-row">
                    <div className="dun-label">中道</div>
                    {i === 0
                      ? renderPaiDunCards(middle, 'middle')
                      : renderPaiDunCards(aiPlayers[i - 1].middle, 'middle')}
                  </div>
                  <div className="result-dun-row">
                    <div className="dun-label">尾道</div>
                    {i === 0
                      ? renderPaiDunCards(tail, 'tail')
                      : renderPaiDunCards(aiPlayers[i - 1].tail, 'tail')}
                  </div>
                </div>
              ))}
            </div>
            <div className="result-modal-actions">
              <button 
                className="action-button ready-button"
                onClick={() => setShowResult(false)}
              >
                关闭
              </button>
              <button 
                className="action-button restart-button"
                onClick={handleReady}
              >
                再来一局
              </button>
            </div>
          </div>
        </div>
      </>
    );
}