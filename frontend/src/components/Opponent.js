import React from 'react';
import Card from './Card';

const Opponent = ({ name, cardCount, position, isActive }) => {
  // 生成背面朝上的卡牌
  const cards = Array.from({ length: cardCount }, (_, i) => i);
  
  return (
    <div className={`opponent ${position} ${isActive ? 'active' : ''}`}>
      <div className="opponent-info">
        <div className="opponent-name">{name}</div>
        <div className="opponent-status">{cardCount}张牌</div>
      </div>
      
      <div className="opponent-cards">
        {cards.map((_, index) => (
          <div 
            key={index}
            className="opponent-card-back"
            style={{
              transform: `rotate(${index % 2 === 0 ? -2 : 2}deg)`,
              marginLeft: index > 0 ? '-30px' : '0'
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default Opponent;