import React from 'react';
import Card from './Card.jsx';

function Hand({ cards, onCardClick, selectedCards }) {
  return (
    <div className="hand">
      {cards.map((card, index) => (
        <div 
          key={`${card.suit}-${card.rank}-${index}`} // 添加index以防万一有重复的牌对象
          onClick={() => onCardClick(card)}
          style={{
            cursor: 'pointer',
            border: selectedCards.some(selectedCard => 
              selectedCard.suit === card.suit && selectedCard.rank === card.rank
            ) ? '2px solid blue' : 'none' // 选中时添加蓝色边框
          }}
        >
          <Card suit={card.suit} rank={card.rank} />
        </div>
      ))}
    </div>
  );
}

export default Hand;
