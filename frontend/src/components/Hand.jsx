import React from 'react';
import Card from './Card';
import './Hand.css';

function Hand({ cards, selectedCards = [], onCardSelect }) {
  
  // 检查一张牌是否被选中
  const isCardSelected = (card) => {
    return selectedCards.some(selected => selected.rank === card.rank && selected.suit === card.suit);
  };

  return (
    <div className="hand-display-container">
      {cards.length > 0 ? (
        <div className="hand">
          {cards.map((card, index) => (
            <div 
              className="card-wrapper" 
              key={`${card.rank}-${card.suit}`}
              style={{'--card-index': index}} /* 用于CSS动画 */
            >
              <Card
                suit={card.suit}
                rank={card.rank}
                isSelected={isCardSelected(card)}
                onClick={() => onCardSelect(card)}
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-hand-message">你已经出完所有牌了！</p>
      )}
    </div>
  );
}

export default Hand;
