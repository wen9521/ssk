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

// Helper to convert card object to string for AI logic
const toCardString = (card) => {
    const rankMap = { 'A': 'ace', 'K': 'king', 'Q': 'queen', 'J': 'jack', 'T': '10' };
    const rankStr = rankMap[card.rank] || card.rank.toLowerCase();
    return `${rankStr}_of_${card.suit}`;
};

// Helper to convert string back to card object
const toCardObject = (cardStr) => {
    const [rankStr, , suit] = cardStr.split('_');
    const rankMapReverse = { 'ace': 'A', 'king': 'K', 'queen': 'Q', 'jack': 'J', '10': 'T' };
    const rank = rankMapReverse[rankStr] || rankStr;
    return { rank, suit };
};

export default function GameBoard({ players, myPlayerId, onCompare, onRestart, onQuit }) {
  // --- Guard Clauses ---
  if (!players || players.length === 0) {
    return (
      <div className="play-container"><div className="game-wrapper"><div>Loading Game...</div></div></div>
    );
  }
  const myPlayer = players.find(p => p.id === myPlayerId);
  if (!myPlayer) {
    return (
      <div className="play-container"><div className="game-wrapper"><div>Initializing player...</div></div></div>
    );
  }

  const getInitialPlayerState = (player) => {
    const cards = player.cards13 || player.hand || [];
    const head = player.head || [];
    const middle = player.middle || [];
    const tail = player.tail || [];
    const myCards = (head.length > 0 || middle.length > 0 || tail.length > 0) ? [] : cards;
    return { myCards, head, middle, tail };
  };

  const initialState = getInitialPlayerState(myPlayer);
  
  // State management
  const [myCards, setMyCards] = useState(() => sortHand(initialState.myCards));
  const [selected, setSelected] = useState({ area: '', cards: [] });
  const [head, setHead] = useState(() => sortHand(initialState.head));
  const [middle, setMiddle] = useState(() => sortHand(initialState.middle));
  const [tail, setTail] = useState(() => sortHand(initialState.tail));
  const [submitMsg, setSubmitMsg] = useState('');
  const [submitted, setSubmitted] = useState(myPlayer.submitted || false);
  const [showResult, setShowResult] = useState(false);
  const [resultModalData, setResultModalData] = useState(null);

  // Effect to reset the board when a new round starts
  useEffect(() => {
    const freshPlayer = players.find(p => p.id === myPlayerId);
    if (freshPlayer) {
      const { myCards, head, middle, tail } = getInitialPlayerState(freshPlayer);
      setMyCards(sortHand(myCards));
      setHead(sortHand(head));
      setMiddle(sortHand(middle));
      setTail(sortHand(tail));
      setSubmitted(freshPlayer.submitted || false);
      setSubmitMsg('');
      setShowResult(false);
      setResultModalData(null);
    }
  }, [players, myPlayerId]);

  // Effect to show results
  useEffect(() => {
    const finalResult = players.some(p => typeof p.score === 'number');
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
      }, 8000); 
      return () => clearTimeout(timer);
    }
  }, [showResult, onRestart]);

  function handleSmartSplit() {
    if (myCards.length !== 13) return;
    const cardStrings = myCards.map(toCardString);
    const hands = SmartSplit(cardStrings); 
    if (hands && hands.length > 0) {
        const bestHand = hands[0];
        setHead(sortHand(bestHand.head.map(toCardObject)));
        setMiddle(sortHand(bestHand.middle.map(toCardObject)));
        setTail(sortHand(bestHand.tail.map(toCardObject)));
        setMyCards([]);
    }
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
      setTimeout(() => setSubmitMsg(''), 2000);
      return;
    }
    setSubmitted(true);
    if (typeof onCompare === 'function') {
      onCompare({ head, middle, tail });
    }
  }

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

  function renderCards(arr, area) {
    if (!arr) return null;
    return arr.map((card, index) => {
      const isSelected = area !== 'result' && selected.area === area && selected.cards.some(c => c.rank === card.rank && c.suit === card.suit);
      return (
        <div 
            key={`${card.rank}_of_${card.suit}_${area}_${index}`}
            className="card-wrapper-dun"
            style={{ '--card-index': index, zIndex: index }}
        >
          <Card
            suit={card.suit}
            rank={card.rank}
            isSelected={isSelected}
            onClick={area !== 'result' ? () => handleCardClick(card, area) : undefined}
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
            <div className="cards-area">{renderCards(arr, area)}</div>
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
    const sortedPlayers = [...resultModalData].sort((a, b) => (b.score || 0) - (a.score || 0));
    return (
      <div className="modal-overlay" onClick={() => typeof onRestart === 'function' && onRestart()}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close-btn" onClick={() => typeof onRestart === 'function' && onRestart()}>×</button>
          {sortedPlayers.map(p => (
            <div key={p.id} className="result-player">
              <div className={`result-player-header ${p.id === myPlayerId ? 'me' : ''}`}>
                <span className="player-name">{p.name}</span>
                {p.isFoul && <span className="foul-tag"> (倒水)</span>}
                <span className="player-score"> ({p.score > 0 ? '+' : ''}{p.score || 0}分)</span>
              </div>
              <div className="result-hand">{renderCards(sortHand(p.head || []), 'result')}</div>
              <div className="result-hand">{renderCards(sortHand(p.middle || []), 'result')}</div>
              <div className="result-hand">{renderCards(sortHand(p.tail || []), 'result')}</div>
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
            {submitted ? '等待比牌' : '开始比牌'}
          </button>
        </div>

        {renderMyCards()}
        
        <div className="message-area">{submitMsg}</div>
        
        {renderResultModal()}
      </div>
    </div>
  );
}
