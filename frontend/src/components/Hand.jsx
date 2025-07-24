import React, { useState } from 'react';
import Card from './Card';
import './Hand.css';

function Hand({ cards, onPlay }) {
  const [selectedCards, setSelectedCards] = useState([]);

  const handleCardClick = (card) => {
    setSelectedCards((prev) =>
      prev.some((c) => c.suit === card.suit && c.rank === card.rank)
        ? prev.filter((c) => c.suit !== card.suit || c.rank !== card.rank)
        : [...prev, card]
    );
  };

  const handlePlayClick = () => {
    if (selectedCards.length > 0) {
      onPlay(selectedCards);
      setSelectedCards([]);
    }
  };

  return (
    <div className="hand-container">
      <div className="hand">
        {cards.map((card) => (
          <Card
            key={`${card.rank}-${card.suit}`}
            suit={card.suit}
            rank={card.rank}
            isSelected={selectedCards.some((c) => c.suit === card.suit && c.rank === card.rank)}
            onClick={() => handleCardClick(card)}
          />
        ))}
      </div>
      <button className="play-button" onClick={handlePlayClick} disabled={selectedCards.length === 0}>
        Play
      </button>
    </div>
  );
}

export default Hand;
