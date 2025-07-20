import React from 'react';
import Card from './Card.jsx';

function Hand({ cards, onCardClick, selectedCards = [] }) {
  return (
    <div className="hand">
      {cards.map((card, index) => (
        <div 
          key={`${card.suit}-${card.rank}-${index}`}
          onClick={() => onCardClick && onCardClick(card)}
          style={{
            cursor: onCardClick ? 'pointer' : 'default',
            border: selectedCards.some(selectedCard => 
              selectedCard.suit === card.suit && selectedCard.rank === card.rank
            ) ? '2px solid blue' : 'none'
          }}
        >
          <Card suit={card.suit} rank={card.rank} />
        </div>
      ))}
    </div>
  );
}

export default Hand;
