// frontend/src/components/Card.jsx

import React from 'react';
import './Card.css';

// 添加了 onDragStart, draggable 和 isDragging 属性
function Card({ card, isSelected, onClick, onDragStart, isDragging }) {
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
      draggable="true" // 使卡片可拖拽
      onDragStart={onDragStart} // 绑定拖拽开始事件
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
