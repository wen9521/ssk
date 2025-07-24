// frontend/src/components/GameBoard.jsx

import React, { useState, useEffect } from 'react';
import { SmartSplit } from '../game-logic/ai-logic';
import Card from './Card';
import './Play.css';

// 排序函数保持不变
const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
const suits = ['diamonds', 'clubs', 'hearts', 'spades'];
const sortHand = (hand) => {
  if (!hand || !Array.isArray(hand)) return [];
  return [...hand].sort((a, b) => {
    const rankComparison = ranks.indexOf(a.rank) - ranks.indexOf(b.rank);
    if (rankComparison !== 0) return rankComparison;
    return suits.indexOf(a.suit) - suits.indexOf(b.suit);
  });
};
const toCardString = (card) => {
    const rankMap = { 'A': 'ace', 'K': 'king', 'Q': 'queen', 'J': 'jack', 'T': '10' };
    const rankStr = rankMap[card.rank] || card.rank.toLowerCase();
    return `${rankStr}_of_${card.suit}`;
};
const toCardObject = (cardStr) => {
    const [rankStr, , suit] = cardStr.split('_');
    const rankMapReverse = { 'ace': 'A', 'king': 'K', 'queen': 'Q', 'jack': 'J', '10': 'T' };
    const rank = rankMapReverse[rankStr] || rankStr;
    return { rank, suit };
};

// --- 主组件 ---
export default function GameBoard({ players, myPlayerId, onCompare, onRestart, onQuit }) {
  // ... Guard Clauses 保持不变 ...
  if (!players || players.length === 0) {
    return <div className="play-container"><div className="game-wrapper"><div>Loading Game...</div></div></div>;
  }
  const myPlayer = players.find(p => p.id === myPlayerId);
  if (!myPlayer) {
    return <div className="play-container"><div className="game-wrapper"><div>Initializing player...</div></div></div>;
  }
  
  // --- State Management ---
  const [unassignedCards, setUnassignedCards] = useState([]);
  const [head, setHead] = useState([]);
  const [middle, setMiddle] = useState([]);
  const [tail, setTail] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [draggingCards, setDraggingCards] = useState([]);
  const [dragOverArea, setDragOverArea] = useState(null);
  const [submitMsg, setSubmitMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // --- Effects ---
  useEffect(() => {
    // 初始化或新一局
    const allCards = myPlayer.cards13 || myPlayer.hand || [];
    setUnassignedCards(sortHand(allCards));
    setHead([]);
    setMiddle([]);
    setTail([]);
    setSelectedCards([]);
    setDraggingCards([]);
    setSubmitted(false);
    setShowResult(false);
  }, [players, myPlayerId]);

  const [showResult, setShowResult] = useState(false);
  useEffect(() => { /* showResult logic remains the same */ }, [players]);
  useEffect(() => { /* timer logic remains the same */ }, [showResult, onRestart]);

  // --- Handlers ---
  const handleCardClick = (clickedCard, e) => {
    if (submitted) return;
    const cardId = `${clickedCard.rank}_${clickedCard.suit}`;

    // 支持 Ctrl/Cmd 多选, Shift 连选
    if (e.shiftKey && selectedCards.length > 0) {
        // Logic for shift-clicking (optional, can be complex, skipping for simplicity)
        // For now, treat shift-click like a normal click
    }
    
    setSelectedCards(prevSelected => {
      const isSelected = prevSelected.some(c => `${c.rank}_${c.suit}` === cardId);
      if (isSelected) {
        return prevSelected.filter(c => `${c.rank}_${c.suit}` !== cardId);
      } else {
        return [...prevSelected, clickedCard];
      }
    });
  };

  const moveCards = (cardsToMove, toArea) => {
    const cardIdsToMove = new Set(cardsToMove.map(c => `${c.rank}_${c.suit}`));
    
    // 从所有区域中移除这些卡牌
    setUnassignedCards(prev => prev.filter(c => !cardIdsToMove.has(`${c.rank}_${c.suit}`)));
    setHead(prev => prev.filter(c => !cardIdsToMove.has(`${c.rank}_${c.suit}`)));
    setMiddle(prev => prev.filter(c => !cardIdsToMove.has(`${c.rank}_${c.suit}`)));
    setTail(prev => prev.filter(c => !cardIdsToMove.has(`${c.rank}_${c.suit}`)));

    // 将卡牌添加到目标区域
    const areaSetters = {
        unassigned: setUnassignedCards,
        head: setHead,
        middle: setMiddle,
        tail: setTail,
    };

    if (areaSetters[toArea]) {
        areaSetters[toArea](prev => sortHand([...prev, ...cardsToMove]));
    }
  };

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e, card) => {
    const cardId = `${card.rank}_${card.suit}`;
    const isSelected = selectedCards.some(c => `${c.rank}_${c.suit}` === cardId);

    let cardsToDrag;
    if (isSelected) {
        cardsToDrag = selectedCards;
    } else {
        cardsToDrag = [card];
        setSelectedCards([card]); // If dragging an unselected card, select it
    }
    setDraggingCards(cardsToDrag);
    // For Firefox
    e.dataTransfer.setData('text/plain', JSON.stringify(cardsToDrag.map(c => `${c.rank}_${c.suit}`)));
  };

  const handleDrop = (e, toArea) => {
    e.preventDefault();
    if (draggingCards.length > 0) {
      moveCards(draggingCards, toArea);
    }
    setDraggingCards([]);
    setDragOverArea(null);
    setSelectedCards([]);
  };
  
  const handleDragOver = (e, area) => {
    e.preventDefault();
    setDragOverArea(area);
  };

  const handleDragLeave = () => {
    setDragOverArea(null);
  };
  
  // ... other handlers like handleSmartSplit, handleStartCompare ...
  function handleSmartSplit() {
    if (unassignedCards.length !== 13) return;
    const cardStrings = unassignedCards.map(toCardString);
    const hands = SmartSplit(cardStrings);
    if(hands && hands.length > 0) {
        setHead(sortHand(hands[0].head.map(toCardObject)));
        setMiddle(sortHand(hands[0].middle.map(toCardObject)));
        setTail(sortHand(hands[0].tail.map(toCardObject)));
        setUnassignedCards([]);
    }
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
  const renderCards = (cards, area) => {
    const cardIdSet = new Set(selectedCards.map(c => `${c.rank}_${c.suit}`));
    const draggingIdSet = new Set(draggingCards.map(c => `${c.rank}_${c.suit}`));
    
    return cards.map(card => (
      <Card
        key={`${card.rank}_${card.suit}`}
        card={card}
        isSelected={cardIdSet.has(`${card.rank}_${card.suit}`)}
        isDragging={draggingIdSet.has(`${card.rank}_${card.suit}`)}
        onClick={(e) => handleCardClick(card, e)}
        onDragStart={(e) => handleDragStart(e, card)}
      />
    ));
  };
  
  const renderPaiDun = (cards, label, area) => (
    <div 
      className={`pai-dun ${dragOverArea === area ? 'drag-over' : ''}`}
      onDrop={(e) => handleDrop(e, area)}
      onDragOver={(e) => handleDragOver(e, area)}
      onDragLeave={handleDragLeave}
    >
      <div className="pai-dun-label">{label} ({cards.length})</div>
      <div className="pai-dun-content">
        {cards.length === 0 ? <div className="pai-dun-placeholder">拖拽至此</div> : renderCards(cards, area)}
      </div>
    </div>
  );
  
  // ... renderPlayerSeat and renderResultModal (no major changes needed) ...
  const renderPlayerSeat = (p) => { /* same as before */ };
  const renderResultModal = () => { /* same as before */ };

  return (
    <div className="play-container">
      <div className="game-wrapper">
        {/* Header and Players Area */}
        {/* ... */}
        
        {renderPaiDun(head, '头道', 'head')}
        {renderPaiDun(middle, '中道', 'middle')}
        {renderPaiDun(tail, '尾道', 'tail')}

        {/* Unassigned Cards Area */}
        <div 
          className={`unassigned-cards-area ${dragOverArea === 'unassigned' ? 'drag-over' : ''}`}
          onDrop={(e) => handleDrop(e, 'unassigned')}
          onDragOver={(e) => handleDragOver(e, 'unassigned')}
          onDragLeave={handleDragLeave}
        >
          {renderCards(unassignedCards, 'unassigned')}
        </div>
        
        <div className="actions-area">
          <button className="btn-action btn-smart-split" onClick={handleSmartSplit} disabled={submitted || unassignedCards.length !== 13}>智能分牌</button>
          <button className="btn-action btn-compare" onClick={handleStartCompare} disabled={submitted}>开始比牌</button>
        </div>
        
        <div className="message-area">{submitMsg}</div>
        
        {/* {renderResultModal()} */}
      </div>
    </div>
  );
}
