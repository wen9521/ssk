// src/components/GameBoard.jsx
import React, { useState, useEffect } from 'react';
import Card from './Card';

// 把 STAGES 移出来，或者确保它在两个 store 里都正确导出且一致
// 为了安全起见，我们直接在这里定义，因为它是个通用常量
const STAGES = {
  LOBBY: 'lobby',
  DEALING: 'dealing',
  PLAYING: 'playing',
  SUBMITTING: 'submitting',
  FINISHED: 'finished',
};

const ranks = ['2','3','4','5','6','7','8','9','T','J','Q','K','A'];
const suits = ['diamonds','clubs','hearts','spades'];

const sortHandInternal = (hand) => {
  if (!Array.isArray(hand)) return [];
  return [...hand].sort((a, b) => {
    const rA = ranks.indexOf(a.rank);
    const rB = ranks.indexOf(b.rank);
    if (rA !== rB) return rA - rB;
    return suits.indexOf(a.suit) - suits.indexOf(b.suit);
  });
};

export default function GameBoard({ players, myPlayerId, stage, onReady, onCompare, onRestart, onQuit, onUpdateHands, onAutoSplit, gameMode = 'thirteen-cards' }) {
  const me = players.find(p => p.id === myPlayerId);
  
  const [selectedCards, setSelectedCards] = useState([]);
  const [draggedCards, setDraggedCards] = useState(null);
  const [dragOverArea, setDragOverArea] = useState(null);
  const [showResult, setShowResult] = useState(false);
  
  const isEightCardsMode = gameMode === 'eight-cards';
  // 十三水模式下才可以手动理牌和智能理牌
  const canManualSplit = !isEightCardsMode && stage === STAGES.PLAYING;

  useEffect(() => {
    if (stage === STAGES.FINISHED) {
      setShowResult(true);
      const timer = setTimeout(() => {
        setShowResult(false);
        if (onRestart) onRestart();
      }, 10000);
      return () => clearTimeout(timer);
    } else {
      setShowResult(false);
    }
  }, [stage, onRestart]);

  useEffect(() => {
    if (stage !== STAGES.PLAYING) {
      setSelectedCards([]);
    }
  }, [stage]);

  const handleCardClick = (card, area, event) => {
    if (!canManualSplit || !me) return;
    const cardId = `${card.rank}_${card.suit}`;
    const isSelected = selectedCards.some(c => c.id === cardId);
    if (event.shiftKey) {
      setSelectedCards(prev => isSelected ? prev.filter(c => c.id !== cardId) : [...prev, { ...card, area, id: cardId }]);
    } else {
      setSelectedCards(isSelected && selectedCards.length === 1 ? [] : [{ ...card, area, id: cardId }]);
    }
  };

  const handleDragStart = (e, card, area) => {
    if (!canManualSplit || !me) return;
    const cardId = `${card.rank}_${card.suit}`;
    let cardsToDrag = selectedCards.some(c => c.id === cardId) ? selectedCards : [{ ...card, area, id: cardId }];
    if (!selectedCards.some(c => c.id === cardId)) {
        setSelectedCards(cardsToDrag);
    }
    setDraggedCards(cardsToDrag);
    e.dataTransfer.setData("text/plain", JSON.stringify(cardsToDrag));
  };

  const handleDrop = (e, toArea) => {
    if (!canManualSplit || !draggedCards) return;
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

    if (onUpdateHands) onUpdateHands(myPlayerId, hands);
    setSelectedCards([]);
    setDraggedCards(null);
  };
  
  const renderSeat = (p) => (
    <div key={p.id} className={`player-seat ${p.id === myPlayerId ? 'player-me' : ''}`}>
      <div className="player-name">{p.name}</div>
      <div className={`player-status ${p.submitted || (p.isReady && stage !== STAGES.LOBBY) ? 'ready' : ''}`}>
        {p.submitted ? '已理牌' : (p.isReady ? (p.isAI ? '已理牌' : '已准备') : '等待中')}
      </div>
    </div>
  );

  const renderPile = (cards, label, area) => (
    <div
      className={`pai-dun ${dragOverArea === area && canManualSplit ? 'drag-over' : ''}`}
      onDragOver={(e) => { if (canManualSplit) e.preventDefault(); setDragOverArea(area); }}
      onDragLeave={() => setDragOverArea(null)}
      onDrop={(e) => handleDrop(e, area)}
    >
      <div className="card-display-area">
        {(cards || []).map((card, i) => {
          const cardId = `${card.rank}_${card.suit}`;
          const isSelected = selectedCards.some(c => c.id === cardId);
          return (
            <div
              key={`${cardId}_${area}_${i}`}
              className="card-wrapper-dun"
              style={{ zIndex: isSelected ? 100 + i : i }}mekashi

print(default_api.read_file(path="frontend/src/utils/store.js"))
print(default_api.read_file(path="frontend/src/utils/eight-cards.store.js"))
print(default_api.read_file(path="frontend/src/components/Play.css"))
print(default_api.read_file(path="frontend/src/components/Play.jsx"))
print(default_api.read_file(path="frontend/src/components/EightCardsPlay.jsx"))
print(default_api.read_file(path="frontend/src/components/doudizhu/DoudizhuPlay.jsx"))
print(default_api.read_file(path="frontend/src/components/doudizhu/DoudizhuBoard.jsx"))
print(default_api.read_file(path="frontend/src/components/doudizhu/Doudizhu.css"))
mekashi
