// src/components/GameBoard.jsx
import React, { useState, useEffect } from 'react';
import Card from './Card';
import { STAGES } from '../utils/store'; // STAGES 定义是通用的，可以继续使用

const ranks = ['2','3','4','5','6','7','8','9','T','J','Q','K','A'];
const suits = ['diamonds','clubs','hearts','spades'];

const sortHandInternal = (hand) => {
  // ... (此函数保持不变)
  if (!Array.isArray(hand)) return [];
  return [...hand].sort((a, b) => {
    const rA = ranks.indexOf(a.rank);
    const rB = ranks.indexOf(b.rank);
    if (rA !== rB) return rA - rB;
    return suits.indexOf(a.suit) - suits.indexOf(b.suit);
  });
};

// 1. 从 props 解构出新的 gameMode，并给一个默认值
export default function GameBoard({ players, myPlayerId, stage, onReady, onCompare, onRestart, onQuit, onUpdateHands, gameMode = 'thirteen-cards' }) {
  const me = players.find(p => p.id === myPlayerId);
  // autoSplitForPlayer 是十三水特有的，这里不再需要
  
  const [selectedCards, setSelectedCards] = useState([]);
  const [draggedCards, setDraggedCards] = useState(null);
  const [dragOverArea, setDragOverArea] = useState(null);
  const [showResult, setShowResult] = useState(false);
  
  const isEightCardsMode = gameMode === 'eight-cards';

  useEffect(() => {
    // ... (此 effect 保持不变)
    if (stage === STAGES.FINISHED) {
      setShowResult(true);
      const timer = setTimeout(() => {
        setShowResult(false);
        onRestart();
      }, 10000);
      return () => clearTimeout(timer);
    } else {
      setShowResult(false);
    }
  }, [stage, onRestart]);

  useEffect(() => {
    // ... (此 effect 保持不变)
    if (stage !== STAGES.PLAYING) {
      setSelectedCards([]);
    }
  }, [stage]);

  // ... (handleCardClick, handleDragStart, handleDrop 函数保持不变) ...
  const handleCardClick = (card, area, event) => {
    if (stage !== STAGES.PLAYING || !me || isEightCardsMode) return; // 八张模式禁用手动理牌
    const cardId = `${card.rank}_${card.suit}`;
    const isSelected = selectedCards.some(c => c.id === cardId);
    if (event.shiftKey) {
      setSelectedCards(prev => isSelected ? prev.filter(c => c.id !== cardId) : [...prev, { ...card, area, id: cardId }]);
    } else {
      setSelectedCards(isSelected && selectedCards.length === 1 ? [] : [{ ...card, area, id: cardId }]);
    }
  };

  const handleDragStart = (e, card, area) => {
    if (stage !== STAGES.PLAYING || isEightCardsMode) return; // 八张模式禁用拖拽
    const cardId = `${card.rank}_${card.suit}`;
    let cardsToDrag = selectedCards.some(c => c.id === cardId) ? selectedCards : [{ ...card, area, id: cardId }];
    if (!selectedCards.some(c => c.id === cardId)) {
        setSelectedCards(cardsToDrag);
    }
    setDraggedCards(cardsToDrag);
    e.dataTransfer.setData("text/plain", JSON.stringify(cardsToDrag));
  };

  const handleDrop = (e, toArea) => {
    if (stage !== STAGES.PLAYING || !draggedCards || isEightCardsMode) return; // 八张模式禁用拖放
    e.preventDefault();
    setDragOverArea(null);
    const draggedData = JSON.parse(e.dataTransfer.getData("text/plain"));
    
    let hands = { head: [...(me.head || [])], middle: [...(me.middle || [])], tail: [...(me.tail || [])] };
    
    draggedData.forEach(dragged => {
      for (const areaName in hands) {
        hands[areaName] = hands[areaName].filter(c => !(c.rank === dragged.rank && c.suit === dragged.suit));
      }
    });

    draggedData.forEach(dragged => {
      hands[toArea].push({ rank: dragged.rank, suit: dragged.suit });
    });
    
    hands.head = sortHandInternal(hands.head);
    hands.middle = sortHandInternal(hands.middle);
    hands.tail = sortHandInternal(hands.tail);

    onUpdateHands(myPlayerId, hands);
    setSelectedCards([]);
    setDraggedCards(null);
  };
  
  const renderSeat = (p) => (
    // ... (此函数保持不变)
     <div key={p.id} className={`player-seat ${p.id === myPlayerId ? 'player-me' : ''}`}>
      <div className="player-name">{p.name}</div>
      <div className={`player-status ${p.submitted || (p.isReady && stage !== STAGES.LOBBY) ? 'ready' : ''}`}>
        {p.submitted ? '已理牌' : (p.isReady ? (p.isAI ? '已理牌' : '已准备') : '等待中')}
      </div>
    </div>
  );

  const renderPile = (cards, label, area) => (
    <div
      className={`pai-dun ${dragOverArea === area ? 'drag-over' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragOverArea(area); }}
      onDragLeave={() => setDragOverArea(null)}
      onDrop={(e) => handleDrop(e, area)}
    >
      <div className="card-display-area">
        {(cards || []).map((card, i) => {
          const cardId = `${card.rank}_${card.suit}`;
          const isSelected = selectedCards.some(c => c.id === cardId);
          // 在八张模式下，牌不能被拖拽
          const isDraggable = !isEightCardsMode;
          return (
            <div
              key={`${cardId}_${area}_${i}`}
              className="card-wrapper-dun"
              style={{ zIndex: isSelected ? 100 + i : i }}mekashi

print(default_api.read_file(path="frontend/src/utils/store.js"))
print(default_api.read_file(path="frontend/src/utils/eight-cards.store.js"))
print(default_api.read_file(path="frontend/src/components/Play.css"))
mekashi
