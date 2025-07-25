// frontend/src/components/Card.jsx

import React from 'react';
import './Card.css';

function Card({ card, isSelected, onClick, onDragStart, isDragging }) {
  // --- FIX: 添加一个安全检查，防止 card prop 为 undefined 时程序崩溃 ---
  if (!card || typeof card.rank === 'undefined' || typeof card.suit === 'undefined') {
    // 这种情况不应该发生，但作为保护措施可以防止应用崩溃
    console.error('Card component received invalid props:', { card });
    return <div className="card"><div className="card-inner">?</div></div>;
  }
  
  const getDisplayRank = (rank) => {
    switch (rank) {
      case 'A': return 'ace';
      case 'K': return 'king';
      case 'Q': return 'queen';
      case 'J': return 'jack';
      case 'T': return '10';
      default: return rank;
    }
  };

  const displayRank = getDisplayRank(card.rank);
  const cardImagePath = `${process.env.PUBLIC_URL}/assets/cards/${displayRank}_of_${card.suit}.svg`;

  const className = `card ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`;

  return (
    <div 
      className={className} 
      onClick={onClick}
      draggable="true"
      onDragStart={onDragStart}
    >
      <div className="card-inner">
        <div className="card-front">
          <img src={cardImagePath} alt={`${card.rank} of ${card.suit}`} className="card-face-img" />
        </div>
        <div className="card-back">
          <div className="card-back-pattern"></div>
        </div>
      </div>
    </div>
  );
}

export default Card;
