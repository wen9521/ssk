// src/components/GameBoard.jsx
import React, { useState, useEffect } from 'react';
import Card from './Card';
import { STAGES, useGameStore } from '../utils/store';

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

export default function GameBoard({ players, myPlayerId, stage, onReady, onCompare, onRestart, onQuit, onUpdateHands }) {
  const me = players.find(p => p.id === myPlayerId);
  const autoSplitForPlayer = useGameStore(state => state.autoSplitForPlayer);

  const [selectedCards, setSelectedCards] = useState([]);
  const [draggedCards, setDraggedCards] = useState(null);
  const [dragOverArea, setDragOverArea] = useState(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
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
    if (stage !== STAGES.PLAYING) {
      setSelectedCards([]);
    }
  }, [stage]);

  const handleCardClick = (card, area, event) => {
    if (stage !== STAGES.PLAYING || !me) return;
    const cardId = `${card.rank}_${card.suit}`;
    const isSelected = selectedCards.some(c => c.id === cardId);
    if (event.shiftKey) {
      setSelectedCards(prev => isSelected ? prev.filter(c => c.id !== cardId) : [...prev, { ...card, area, id: cardId }]);
    } else {
      setSelectedCards(isSelected && selectedCards.length === 1 ? [] : [{ ...card, area, id: cardId }]);
    }
  };

  const handleDragStart = (e, card, area) => {
    if (stage !== STAGES.PLAYING) return;
    const cardId = `${card.rank}_${card.suit}`;
    let cardsToDrag = selectedCards.some(c => c.id === cardId) ? selectedCards : [{ ...card, area, id: cardId }];
    if (!selectedCards.some(c => c.id === cardId)) {
        setSelectedCards(cardsToDrag);
    }
    setDraggedCards(cardsToDrag);
    e.dataTransfer.setData("text/plain", JSON.stringify(cardsToDrag));
  };

  const handleDrop = (e, toArea) => {
    if (stage !== STAGES.PLAYING || !draggedCards) return;
    e.preventDefault();
    setDragOverArea(null);
    const draggedData = JSON.parse(e.dataTransfer.getData("text/plain"));
    
    let hands = { head: [...(me.head || [])], middle: [...(me.middle || [])], tail: [...(me.tail || [])] };
    
    draggedData.forEach(dragged => {
      for (const areaName in hands) {
        hands[areaName] = hands[areaName].filter(c => !(c.rank === dragged.rank && dragged.suit === c.suit));
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
        {cards?.map((card, i) => {
          const cardId = `${card.rank}_${card.suit}`;
          const isSelected = selectedCards.some(c => c.id === cardId);
          const isDragging = draggedCards?.some(c => c.id === cardId) ?? false;
          return (
            <div
              key={`${cardId}_${area}_${i}`}
              className="card-wrapper-dun"
              style={{ zIndex: isSelected ? 100 + i : i }}
              draggable="true"
              onDragStart={(e) => handleDragStart(e, card, area)}
              onDragEnd={() => setDraggedCards(null)}
            >
              <Card
                card={card}
                isSelected={isSelected}
                isDragging={isDragging}
                onClick={(e) => handleCardClick(card, area, e)}
              />
            </div>
          );
        })}
      </div>
      <div className="pai-dun-label">{label} ({(cards || []).length})</div>
    </div>
  );
  
  const renderResultModal = () => {
    if (!showResult || !players.some(p => p.score != null)) {
      return null;
    }

    const renderResultPile = (pCards, score, rank, areaName) => (
      <div className="result-hand">
        <div className="hand-score">{rank} (得分: {score || 0})</div>
        <div className="hand-cards-display">
          {(pCards || []).map((card, i) => (
            <div key={`${card.rank}_${card.suit}_${areaName}_${i}`} className="card-wrapper-dun">
              <Card card={card} />
            </div>
          ))}
        </div>
      </div>
    );

    return (
      <div className="modal-overlay" onClick={onRestart}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <button className="modal-close-btn" onClick={onRestart}>×</button>
          <h2>对局结果</h2>
          {players.map(p => (
            <div key={p.id} className="result-player">
              <div className={`result-player-header ${p.id === myPlayerId ? 'me' : ''}`}>
                <span className="player-name">{p.name}</span>
                {p.isFoul && <span className="foul-tag">(倒水)</span>}
                <span className="player-score" data-positive={p.score > 0}>
                  总分: {p.score > 0 ? '+' : ''}{p.score || 0}
                </span>
              </div>
              {p.handDetails && (mekashi

print(default_api.read_file(path="frontend/src/utils/store.js"))
mekashi
