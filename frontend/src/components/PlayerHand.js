import React, { useState } from 'react';
import Card from './Card';

const PlayerHand = ({ cards, onCardSelect }) => {
  const [selectedCards, setSelectedCards] = useState([]);
  
  const handleCardClick = (card) => {
    const isSelected = selectedCards.includes(card);
    const newSelected = isSelected 
      ? selectedCards.filter(c => c !== card)
      : [...selectedCards, card];
    
    setSelectedCards(newSelected);
    onCardSelect && onCardSelect(newSelected);
  };
  
  return (
    <div className="player-hand">
      <div className="hand-container">
        {cards.map((card, index) => (
          <Card 
            key={index}
            card={card}
            onClick={handleCardClick}
            isSelected={selectedCards.includes(card)}
          />
        ))}
      </div>
      
      <div className="selected-cards-preview">
        {selectedCards.length > 0 && (
          <div className="preview-title">已选牌 ({selectedCards.length})</div>
        )}
        <div className="preview-cards">
          {selectedCards.map((card, index) => (
            <Card 
              key={`selected-${index}`}
              card={card}
              size="small"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlayerHand;