// src/components/GameBoard.jsx
import React, { useState, useEffect } from 'react';
import Card from './Card';
// STAGES 定义是通用的，可以从任何一个 store 导入，或者单独存放
import { STAGES } from '../utils/store'; 

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

export default function GameBoard({ players, myPlayerId, stage, onReady, onCompare, onRestart, onQuit, onUpdateHands, gameMode = 'thirteen-cards' }) {
  const me = players.find(p => p.id === myPlayerId);
  
  const [selectedCards, setSelectedCards] = useState([]);
  const [draggedCards, setDraggedCards] = useState(null);
  const [dragOverArea, setDragOverArea] = useState(null);
  const [showResult, setShowResult] = useState(false);
  
  const isEightCardsMode = gameMode === 'eight-cards';

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
      }mekashi

print(default_api.read_file(path="frontend/src/utils/store.js"))
print(default_api.read_file(path="frontend/src/utils/eight-cards.store.js"))
print(default_api.read_file(path="frontend/src/components/Play.css"))
mekashi
