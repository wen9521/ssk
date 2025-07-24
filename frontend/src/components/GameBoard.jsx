import React, { useState, useEffect } from 'react';
import { SmartSplit } from '../game-logic/ai-logic';
import Card from './Card'; 
import Hand from './Hand'; 
import './Play.css';

// 定义牌的点数和花色顺序，用于排序
const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
const suits = ['diamonds', 'clubs', 'hearts', 'spades'];

// 卡牌排序函数
const sortHand = (hand) => {
  if (!hand || !Array.isArray(hand)) return [];
  return [...hand].sort((a, b) => {
    const rankComparison = ranks.indexOf(a.rank) - ranks.indexOf(b.rank);
    if (rankComparison !== 0) return rankComparison;
    return suits.indexOf(a.suit) - suits.indexOf(b.suit);
  });
};


export default function GameBoard({ players, myPlayerId, onCompare, onRestart, onReady, onQuit }) {
  // --- Start of Final Fix ---
  // 1. Add a robust guard clause at the very beginning of the component.
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

  const getInitialCards = () => {
      // 在新一局开始时，如果玩家已经分好牌（head, middle, tail有内容），则手牌区为空
      if (myPlayer.head?.length || myPlayer.middle?.length || myPlayer.tail?.length) {
          return [];
      }
      return myPlayer.cards13 || myPlayer.hand || [];
  };

  // State management for the component
  const [myCards, setMyCards] = useState(getInitialCards());
  const [selected, setSelected] = useState({ area: '', cards: [] });
  const [head, setHead] = useState(myPlayer.head || []);
  const [middle, setMiddle] = useState(myPlayer.middle || []);
  const [tail, setTail] = useState(myPlayer.tail || []);
  const [submitMsg, setSubmitMsg] = useState('');
  const [submitted, setSubmitted] = useState(myPlayer.submitted || false);
  const [isReady, setIsReady] = useState(myPlayer.submitted || false);
  const [showResult, setShowResult] = useState(false);
  const [resultModalData, setResultModalData] = useState(null);

  // Effect to reset the board when a new hand is dealt
  useEffect(() => {
    const freshPlayer = players.find(p => p.id === myPlayerId);
    if (freshPlayer) {
      const initialCards = (freshPlayer.head?.length || freshPlayer.middle?.length || freshPlayer.tail?.length) 
        ? [] 
        : (freshPlayer.cards13 || freshPlayer.hand || []);
      
      setMyCards(sortHand(initialCards));
      setHead(sortHand(freshPlayer.head || []));
      setMiddle(sortHand(freshPlayer.middle || []));
      setTail(sortHand(freshPlayer.tail || []));
      setSubmitted(freshPlayer.submitted || false);
      setIsReady(freshPlayer.submitted || false);
      setSubmitMsg('');
      setShowResult(false);
      setResultModalData(null);
    }
  }, [players, myPlayerId]);

  // Effect to handle showing the final results.
  useEffect(() => {
    const allSubmitted = players.every(p => p.submitted);
    const finalResult = players.some(p => p.score !== undefined);
    if (allSubmitted && finalResult) {
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
      }, 8000); // 延长显示时间到8秒
      return () => clearTimeout(timer);
    }
  }, [showResult, onRestart]);

  function handleSmartSplit() {
    // ai-logic.js SmartSplit expects string array like 'ace_of_spades'
    const cardStrings = myCards.map(c => `${c.rank === 'T' ? '10' : c.rank.toLowerCase()}_of_${c.suit}`);
    const hands = SmartSplit(cardStrings);
    const bestHand = hands[0];

    // Convert back to card objects
    const toCardObject = (cardStr) => {
        const [rankStr, , suit] = cardStr.split('_');
        const rank = rankStr === '10' ? 'T' : rankStr.charAt(0).toUpperCase();
        return { rank, suit };
    };
    
    setHead(sortHand(bestHand.head.map(toCardObject)));
    setMiddle(sortHand(bestHand.middle.map(toCardObject)));
    setTail(sortHand(bestHand.tail.map(toCardObject)));
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
    setIsReady(true);
    if (typeof onCompare === 'function') {
      onCompare({ head, middle, tail });
    }
  }

  const handleReadyClick = () => {
    // In offline mode, this button is less meaningful, let's keep it simple
    if (submitted) {
        console.log("Already submitted.");
        return;
    }
    handleStartCompare();
  };

  // --- Render Functions ---

  function renderPlayerSeat(p) {
    const isMe = p.id === myPlayerId;
    return (
      <div key={p.id} className={`player-seat ${isMe ? 'player-me' : ''}`}>
        <div>{p.name}</div>
        <div className={`player-status ${p.submitted ? 'ready' : ''}`}>
          {p.submitted ? '已准备' : '等待中'}
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
            className="card-wrapper-dun"
            style={{ '--card-index': index, zIndex: index }}
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
      <div className="my-cards-area">
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
          <button className="modal-close-btn" onClick={() => typeof onRestart === 'function' && onRestart()}>×</button>
          {resultModalData.map(p => (
            <div key={p.id} className="result-player">
              <div className={`result-player-header ${p.id === myPlayerId ? 'me' : ''}`}>
                <span className="player-name">{p.name}</span>
                {p.isFoul && <span className="foul-tag"> (倒水)</span>}
                <span className="player-score"> ({p.score || 0}分)</span>
              </div>
              <div className="result-hand">{renderPaiDunCards(p.head || [], 'result')}</div>
              <div className="result-hand">{renderPaiDunCards(p.middle || [], 'result')}</div>
              <div className="result-hand">{renderPaiDunCards(p.tail || [], 'result')}</div>
            </div>
          ))}
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
          <button className="btn-action btn-smart-split" onClick={handleSmartSplit} disabled={submitted || myCards.length !== 13}>
            智能分牌
          </button>
          <button className="btn-action btn-compare" onClick={handleStartCompare} disabled={submitted}>
            {submitted ? '已准备' : '开始比牌'}
          </button>
        </div>

        {renderMyCards()}
        
        <div className="message-area">{submitMsg}</div>
        
        {renderResultModal()}
      </div>
    </div>
  );
}
