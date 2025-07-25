// frontend/src/components/Hand.jsx (新组件)
import React from 'react';
import Card from './Card';
import './Hand.css';

function Hand({ cards, selectedCards, draggedCards, onCardClick, onDragStart, onDragEnd, onDrop }) {
  
  const isCardSelected = (card) => {
    return selectedCards.some(selected => selected.rank === card.rank && selected.suit === card.suit);
  };
  
  const isCardDragging = (card) => {
    return draggedCards?.some(dragged => dragged.rank === card.rank && dragged.suit === card.suit) ?? false;
  };

  return (
    <div 
      className="hand-container"
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      {cards.length > 0 ? (
        <div className="hand" style={{'--total-cards': cards.length}}>
          {cards.map((card, index) => (
            <div 
              className="card-wrapper" 
              key={`${card.rank}-${card.suit}`}
              style={{'--card-index': index}}
              draggable="true"
              onDragStart={(e) => onDragStart(e, card, 'hand')}
              onDragEnd={onDragEnd}
            >
              <Card
                card={card}
                isSelected={isCardSelected(card)}
                isDragging={isCardDragging(card)}
                onClick={(e) => onCardClick(card, 'hand', e)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-hand-message">
          <span>所有单位已部署</span>
        </div>
      )}
    </div>
  );
}

export default Hand;
