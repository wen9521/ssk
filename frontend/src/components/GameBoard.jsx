import React, { useState, useEffect } from 'react';
import { SmartSplit } from '../game-logic/ai-logic'; // ai-logic.js 提供了 SmartSplit
import Card from './Card'; // 引入 Card 组件
import Hand from './Hand'; // 引入 Hand 组件
import './Play.css';

// 定义牌的点数顺序，用于排序
const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
const suits = ['diamonds', 'clubs', 'hearts', 'spades'];

const sortHand = (hand) => {
  if (!hand) return [];
  return [...hand].sort((a, b) => {
    const rankComparison = ranks.indexOf(a.rank) - ranks.indexOf(b.rank);
    if (rankComparison !== 0) return rankComparison;
    return suits.indexOf(a.suit) - suits.indexOf(b.suit);
  });
};

export default function GameBoard({ players, myPlayerId, onCompare, onRestart, onReady, onQuit }) {
  // --- Start of Final Fix ---
  // 1. Add a robust guard clause at the very beginning of the component.
  // This checks if `players` is falsy (like undefined) or an empty array.
  if (!players || players.length === 0) {
    return (
      <div className="play-container">
        <div className="game-wrapper">
          <div>Loading Game...</div>
        </div>
      </div>
    );
  }

  // 2. Derive `myPlayer` directly from props *after* the guard clause.
  // This code will only run if `players` is a valid, non-empty array.
  const myPlayer = players.find(p => p.id === myPlayerId);

  // Add another guard clause in case myPlayer is somehow not found.
  if (!myPlayer) {
    return (
      <div className="play-container">
        <div className="game-wrapper">
          <div>Initializing player...</div>
        </div>
      </div>
    );
  }
  // --- End of Final Fix ---

  // State management for the component, now safely initialized.
  const [myCards, setMyCards] = useState(myPlayer.cards13 || []); // 确保使用正确的 prop
  const [selected, setSelected] = useState({ area: '', cards: [] });
  const [head, setHead] = useState([]);
  const [middle, setMiddle] = useState([]);
  const [tail, setTail] = useState([]);
  const [submitMsg, setSubmitMsg] = useState('');
  const [submitted, setSubmitted] = useState(myPlayer.submitted || false);
  const [isReady, setIsReady] = useState(myPlayer.submitted || false);
  const [showResult, setShowResult] = useState(false);
  const [resultModalData, setResultModalData] = useState(null);

  // Effect to reset the board when a new hand is dealt (i.e., when players prop changes).
  useEffect(() => {
    const freshPlayer = players.find(p => p.id === myPlayerId);
    if (freshPlayer && freshPlayer.cards13) {
      setMyCards(freshPlayer.cards13);
      setHead(freshPlayer.head || []);
      setMiddle(freshPlayer.middle || []);
      setTail(freshPlayer.tail || []);
      setSubmitted(freshPlayer.submitted || false);
      setIsReady(freshPlayer.submitted || false);
      setSubmitMsg('');
    }
  }, [players, myPlayerId]);

  // Effect to handle showing the final results.
  useEffect(() => {
    const finalResult = players.some(p => p.score !== undefined);
    if (finalResult) {
      setResultModalData(players);
      setShowResult(true);
    }
  }, [players]);

  // Effect for auto-closing the result modal.
  useEffect(() => {
    if (showResult) {
      const timer = setTimeout(() => {
        setShowResult(false);
        if (typeof onRestart === 'function') onRestart();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showResult, onRestart]);

  function handleSmartSplit() {
    const hands = SmartSplit(myCards); // ai-logic.js SmartSplit
    const bestHand = hands[0];
    setHead(bestHand.head);
    setMiddle(bestHand.middle);
    setTail(bestHand.tail);
    setMyCards([]);
  }

  function handleCardClick(card, area) {
    if (submitted) return;
    const sourceArea = area || 'hand';
    
    setSelected(sel => {
      if (sel.area !== sourceArea) return { area: sourceArea, cards: [card] };
      const cardExists = sel.cards.some(c => c.rank === card.rank && c.suit === card.suit);
      
      return cardExists
        ? { area: sourceArea, cards: sel.cards.filter(c => !(c.rank === card.rank && c.suit === card.suit)) }
        : { area: sourceArea, cards: [...sel.cards, card] };
    });
  }

  function moveTo(dest) {
    if (submitted) return;
    if (!selected.cards.length) return;
    
    const allHands = { hand: myCards, head, middle, tail };
    const sourceArea = selected.area;

    const selectedSet = new Set(selected.cards.map(c => `${c.rank}_${c.suit}`));

    allHands[sourceArea] = allHands[sourceArea].filter(c => !selectedSet.has(`${c.rank}_${c.suit}`));
    allHands[dest] = [...allHands[dest], ...selected.cards];

    setMyCards(sortHand(allHands.hand));
    setHead(sortHand(allHands.head));
    setMiddle(sortHand(allHands.middle));
    setTail(sortHand(allHands.tail));
    setSelected({ area: dest, cards: [] });
    setSubmitMsg('');
  }

  function handleStartCompare() {
    if (submitted) return;
    if (head.length !== 3 || middle.length !== 5 || tail.length !== 5) {
      setSubmitMsg('请按 3-5-5 张牌分配');
      return;
    }
    setSubmitted(true);
    if (typeof onCompare === 'function') {
      onCompare({ head, middle, tail });
    }
  }

  const handleReadyClick = () => {
    const newReadyState = !isReady;
    setIsReady(newReadyState);
    if (typeof onReady === 'function') {
      onReady(newReadyState);
    }
  }

  // --- Render Functions ---

  function renderPlayerSeat(p) {
    const isMe = p.id === myPlayerId;
    return (
      <div key={p.id} className={`player-seat ${isMe ? 'player-me' : ''}`}>
        <div>{p.name}</div>
        <div className={`player-status ${p.submitted ? 'ready' : ''}`}>
          {p.submitted ? '已准备' : '未准备'}
        </div>
      </div>
    );
  }

  function renderPaiDunCards(arr, area) {
    return arr.map((card, index) => {
      const isSelected = selected.area === area && selected.cards.some(c => c.rank === card.rank && c.suit === card.suit);
      return (
        <div 
            key={`${card.rank}_of_${card.suit}_${area}`}
            className="card-img" // .card-img controls size and absolute position
            style={{ '--card-index': index, zIndex: index }} // Pass index to CSS for staggering
        >
          <Card
            suit={card.suit}
            rank={card.rank}
            isSelected={isSelected}
            onClick={() => handleCardClick(card, area)}
          />
        </div>
      );
    });
  }
  
  function renderPaiDun(arr, label, area) {
    return (
      <div className="pai-dun" onClick={() => moveTo(area)}>
        <div className="pai-dun-content">
          {arr.length === 0 ? (
            <div className="pai-dun-placeholder">请放置</div>
          ) : (
            <div className="cards-area">{renderPaiDunCards(arr, area)}</div>
          )}
        </div>
        <div className="pai-dun-label">{label} ({arr.length})</div>
      </div>
    );
  }

  function renderMyCards() {
    return (
      <div className="my-cards-area" onClick={() => moveTo('hand')}>
        <Hand
            cards={myCards}
            selectedCards={selected.area === 'hand' ? selected.cards : []}
            onCardSelect={(card) => handleCardClick(card, 'hand')}
        />
      </div>
    );
  }
  
  function renderResultModal() {
    if (!showResult || !resultModalData) return null;
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          {resultModalData.map(p => (
            <div key={p.id} className="result-player">
              <div className={`result-player-header ${p.id === myPlayerId ? 'me' : ''}`}>
                {p.name}
                {p.isFoul && <span className="foul-tag"> (倒水)</span>}
                <span> ({p.score || 0}分)</span>
              </div>
              <div className="result-hand"><div className="cards-area">{renderPaiDunCards(p.head || [], 'none')}</div></div>
              <div className="result-hand"><div className="cards-area">{renderPaiDunCards(p.middle || [], 'none')}</div></div>
              <div className="result-hand"><div className="cards-area">{renderPaiDunCards(p.tail || [], 'none')}</div></div>
            </div>
          ))}
          <button className="modal-close-btn" onClick={() => typeof onRestart === 'function' && onRestart()}>×</button>
        </div>
      </div>
    );
  }

  return (
    <div className="play-container">
      <div className="game-wrapper">
        <div className="game-header">
          <button className="btn-quit" onClick={() => typeof onQuit === 'function' && onQuit()}>< 退出房间</button>
          <div className="score-display">
            <span role="img" aria-label="coin" className="coin-icon">🪙</span>
            积分: {myPlayer.points || 0}
          </div>
        </div>
        <div className="players-area">
          {players.map(p => renderPlayerSeat(p))}
        </div>
        
        {renderPaiDun(head, '头道', 'head')}
        {renderPaiDun(middle, '中道', 'middle')}
        {renderPaiDun(tail, '尾道', 'tail')}
        
        <div className="actions-area">
          <button className={`btn-action btn-ready ${isReady ? 'cancel' : ''}`} onClick={handleReadyClick}>
            {isReady ? '取消准备' : '准备'}
          </button>
          <button className="btn-action btn-smart-split" onClick={handleSmartSplit} disabled={submitted || myCards.length !== 13}>
            智能分牌
          </button>
          <button className="btn-action btn-compare" onClick={handleStartCompare} disabled={submitted}>
            开始比牌
          </button>
        </div>

        {renderMyCards()}
        
        <div className="message-area">{submitMsg}</div>
        
        {renderResultModal()}
      </div>
    </div>
  );
}
