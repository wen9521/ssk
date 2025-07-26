// frontend/src/components/common/Hand.jsx
import React from 'react';
import Card from './Card';
import './Hand.css';

const Hand = ({ cards, onCardClick, selectedCards = [], facedown = false }) => {
  return (
    <div className="hand">
      {cards.map((card, index) => (
        <div 
          key={index} 
          className={`card-container ${selectedCards.includes(card) ? 'selected' : ''}`}
          onClick={() => onCardClick && onCardClick(card)}
        >
          <Card card={card} facedown={facedown} />
        </div>
      ))}
    </div>
  );
};

export default Hand;
