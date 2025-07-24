import React, { useState, useEffect } from 'react';
import { SmartSplit } from '../game-logic/thirteen-water';
import './Play.css';

export default function GameBoard({ player, opponent, onPlay, onCompare, onRestart, message, result, onReady, onQuit }) {
  const [players, setPlayers] = useState([player, opponent]);
  const [myPoints, setMyPoints] = useState(0);
  const [myName, setMyName] = useState(player.name);
  const [myCards, setMyCards] = useState(player.hand);
  const [selected, setSelected] = useState({ area: '', cards: [] });
  const [head, setHead] = useState([]);
  const [middle, setMiddle] = useState([]);
  const [tail, setTail] = useState([]);
  const [submitMsg, setSubmitMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultModalData, setResultModalData] = useState(null);

  useEffect(() => {
    if (result) {
      setResultModalData(result);
      setShowResult(true);
    }
  }, [result]);

  useEffect(() => {
    if (showResult) {
      const timer = setTimeout(() => {
        setShowResult(false);
        onRestart();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showResult, onRestart]);

  function handleSmartSplit() {
    const hands = SmartSplit(myCards);
    const bestHand = hands[0];
    setHead(bestHand.head);
    setMiddle(bestHand.middle);
    setTail(bestHand.tail);
    setMyCards([]);
  }

  function handleCardClick(card, area) {
    if (submitted) return;
    setSelected(sel => {
      if (sel.area !== area) return { area, cards: [card] };
      return sel.cards.includes(card)
        ? { area, cards: sel.cards.filter(c => c !== card) }
        : { area, cards: [...sel.cards, card] };
    });
  }

  function moveTo(dest) {
    if (submitted) return;
    if (!selected.cards.length) return;
    let newHand = [...myCards];
    let newHead = [...head];
    let newMiddle = [...middle];
    let newTail = [...tail];
    const from = selected.area;
    if (from === 'hand') newHand = newHand.filter(c => !selected.cards.includes(c));
    if (from === 'head') newHead = newHead.filter(c => !selected.cards.includes(c));
    if (from === 'middle') newMiddle = newMiddle.filter(c => !selected.cards.includes(c));
    if (from === 'tail') newTail = newTail.filter(c => !selected.cards.includes(c));
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

  function handleStartCompare() {
    if (submitted) return;
    if (head.length !== 3 || middle.length !== 5 || tail.length !== 5) {
      setSubmitMsg('请按 3-5-5 张牌分配');
      return;
    }
    setSubmitted(true);
    onCompare({ head, middle, tail });
  }

  function renderPlayerSeat(p) {
    const isMe = p.name === myName;
    return (
      <div key={p.name} className={`player-seat ${isMe ? 'player-me' : ''}`}>
        <div>{p.name}</div>
        <div className={`player-status ${p.submitted ? 'ready' : ''}`}>
          {p.submitted ? '已准备' : '未准备'}
        </div>
      </div>
    );
  }

  function renderPaiDunCards(arr, area) {
    return (
      <div className="cards-area">
        {arr.map((card, idx) => {
          const isSelected = selected.area === area && selected.cards.includes(card);
          return (
            <img
              key={card}
              src={`/assets/cards/${card.rank}_of_${card.suit}.svg`}
              alt={card}
              className={`card-img ${isSelected ? 'selected' : ''}`}
              onClick={() => handleCardClick(card, area)}
              draggable={false}
            />
          );
        })}
      </div>
    );
  }

  function renderPaiDun(arr, label, area) {
    return (
      <div className="pai-dun" onClick={() => moveTo(area)}>
        <div className="pai-dun-content">
          {arr.length === 0 ? (
            <div className="pai-dun-placeholder">请放置</div>
          ) : (
            renderPaiDunCards(arr, area)
          )}
        </div>
        <div className="pai-dun-label">{label}（{arr.length}）</div>
      </div>
    );
  }

  function renderMyCards() {
    return (
      <div className="cards-area">
        {myCards.map(card => (
          <img
            key={card.rank + card.suit}
            src={`/assets/cards/${card.rank}_of_${card.suit}.svg`}
            alt={card}
            className={`card-img ${selected.area === 'hand' && selected.cards.includes(card) ? 'selected' : ''}`}
            onClick={() => handleCardClick(card, 'hand')}
          />
        ))}
      </div>
    );
  }

  function renderResultModal() {
    if (!showResult || !resultModalData) return null;
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          {resultModalData.map(p => (
            <div key={p.name} className="result-player">
              <div className={`result-player-header ${p.name === myName ? 'me' : ''}`}>
                {p.name}
                {p.isFoul && <span className="foul-tag">（倒水）</span>}
                （{p.score || 0}分）
              </div>
              <div className="result-hand">{renderPaiDunCards(p.head || [], 'none')}</div>
              <div className="result-hand">{renderPaiDunCards(p.middle || [], 'none')}</div>
              <div className="result-hand">{renderPaiDunCards(p.tail || [], 'none')}</div>
            </div>
          ))}
          <button className="modal-close-btn" onClick={onRestart}>×</button>
        </div>
      </div>
    );
  }

  return (
    <div className="play-container">
      <div className="game-wrapper">
        <div className="game-header">
          <button className="btn-quit" onClick={onQuit}>&lt; 退出房间</button>
          <div className="score-display">
            <span role="img" aria-label="coin" className="coin-icon">🪙</span>
            积分：{myPoints}
          </div>
        </div>
        <div className="players-area">
          {players.map(p => renderPlayerSeat(p))}
        </div>
        {renderPaiDun(head, '头道', 'head')}
        {renderPaiDun(middle, '中道', 'middle')}
        {renderPaiDun(tail, '尾道', 'tail')}
        <div className="actions-area">
          <button className={`btn-action btn-ready ${isReady ? 'cancel' : ''}`} onClick={() => { setIsReady(!isReady); onReady(!isReady); }}>
            {isReady ? '取消准备' : '准备'}
          </button>
          <button className="btn-action btn-smart-split" onClick={handleSmartSplit} disabled={submitted}>
            智能分牌
          </button>
          <button className="btn-action btn-compare" onClick={handleStartCompare} disabled={submitted}>
            开始比牌
          </button>
        </div>
        <div className="my-cards-area">
          {renderMyCards()}
        </div>
        <div className="message-area">{submitMsg}</div>
        {renderResultModal()}
      </div>
    </div>
  );
}
