import React, { useState, useEffect } from 'react';
import { SmartSplit } from '../game-logic/thirteen-water';
import './Play.css';

export default function GameBoard({ players, myPlayerId, onCompare, onRestart, onReady, onQuit }) {
  const [myPlayer, setMyPlayer] = useState(players.find(p => p.id === myPlayerId));
  const [myCards, setMyCards] = useState(myPlayer.hand);
  const [selected, setSelected] = useState({ area: '', cards: [] });
  const [head, setHead] = useState([]);
  const [middle, setMiddle] = useState([]);
  const [tail, setTail] = useState([]);
  const [submitMsg, setSubmitMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultModalData, setResultModalData] = useState(null);

  // Effect to handle external result updates
  useEffect(() => {
    const finalResult = players.some(p => p.score !== undefined);
    if (finalResult) {
      setResultModalData(players);
      setShowResult(true);
    }
  }, [players]);

  // Effect for auto-closing result modal
  useEffect(() => {
    if (showResult) {
      const timer = setTimeout(() => {
        setShowResult(false);
        if (typeof onRestart === 'function') onRestart();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showResult, onRestart]);

  // AI-powered card splitting
  function handleSmartSplit() {
    const hands = SmartSplit(myCards);
    const bestHand = hands[0];
    setHead(bestHand.head);
    setMiddle(bestHand.middle);
    setTail(bestHand.tail);
    setMyCards([]);
  }

  // Card selection logic
  function handleCardClick(card, area) {
    if (submitted) return;
    setSelected(sel => {
      if (sel.area !== area) return { area, cards: [card] };
      return sel.cards.includes(card)
        ? { area, cards: sel.cards.filter(c => c !== card) }
        : { area, cards: [...sel.cards, card] };
    });
  }

  // Move selected cards to a new area
  function moveTo(dest) {
    if (submitted) return;
    if (!selected.cards.length) return;
    
    const allHands = { hand: myCards, head, middle, tail };
    const sourceArea = selected.area;

    // Remove cards from source
    allHands[sourceArea] = allHands[sourceArea].filter(c => !selected.cards.includes(c));
    // Add cards to destination
    allHands[dest] = [...allHands[dest], ...selected.cards];

    setMyCards(allHands.hand);
    setHead(allHands.head);
    setMiddle(allHands.middle);
    setTail(allHands.tail);
    setSelected({ area: dest, cards: [] });
    setSubmitMsg('');
  }

  // Final submission to compare hands
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

  // Toggle ready state
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
    // This function now only focuses on rendering, logic is handled elsewhere
    return arr.map(card => {
      const isSelected = selected.area === area && selected.cards.includes(card);
      return (
        <img
          key={`${card.rank}_of_${card.suit}`}
          src={`/assets/cards/${card.rank}_of_${card.suit}.svg`}
          alt={`${card.rank} of ${card.suit}`}
          className={`card-img ${isSelected ? 'selected' : ''}`}
          onClick={() => handleCardClick(card, area)}
          draggable={false}
        />
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
      <div className="my-cards-area">
        <div className="cards-area">
          {renderPaiDunCards(myCards, 'hand')}
        </div>
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
          <button className="btn-quit" onClick={() => typeof onQuit === 'function' && onQuit()}>&lt; 退出房间</button>
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
          <button className="btn-action btn-smart-split" onClick={handleSmartSplit} disabled={submitted}>
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
