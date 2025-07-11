import React, { useState, useEffect } from 'react';
import Card from './Card';

const PlayerHand = ({ cards, onCardSelect }) => {
  const [selectedCards, setSelectedCards] = useState([]);
  const [displayCards, setDisplayCards] = useState([]); // State to manage cards being displayed with animation

  // Effect to handle dealing animation
  useEffect(() => {
    if (cards && cards.length > displayCards.length) {
      // New cards have been dealt
      const newCards = cards.slice(displayCards.length);
      newCards.forEach((card, index) => {
        setTimeout(() => {
          setDisplayCards(prevCards => [...prevCards, card]);
        }, index * 100); // Adjust delay as needed for animation speed
      });
    } else if (cards && cards.length < displayCards.length) {
        // Cards were removed or reset, update displayCards directly
        setDisplayCards(cards);
        setSelectedCards([]); // Reset selected cards if hand changes significantly
    } else if (cards && cards.length === displayCards.length && JSON.stringify(cards) !== JSON.stringify(displayCards)) {
        // Same number of cards, but content changed (e.g., re-sorting), update directly
        setDisplayCards(cards);
    }
  }, [cards, displayCards]); // Added displayCards to dependencies to ensure updates are tracked

  const handleCardClick = (card) => {
    const isSelected = selectedCards.includes(card);
    const newSelected = isSelected
      ? selectedCards.filter(c => c !== card)
      : [...selectedCards, card];

    setSelectedCards(newSelected);
    onCardSelect && onCardSelect(newSelected);
  };

  // You will need to define the CSS class 'deal-animation' in your CSS file
  // Example CSS (in index.css or styles.css):
  // @keyframes slideInFromTop {
  //   0% { transform: translateY(-100px); opacity: 0; }
  //   100% { transform: translateY(0); opacity: 1; }
  // }
  // .deal-animation {
  //   animation: slideInFromTop 0.5s ease-out forwards;
  // }

  return (
    <div className="player-hand">
      <div className="hand-container">
        {displayCards.map((card, index) => (
          <div key={index} className="card-container"> {/* Added a container for animation */}
            <Card
              card={card}
              onClick={handleCardClick}
              isSelected={selectedCards.includes(card)}
            />
          </div>
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