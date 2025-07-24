import React from 'react';
import './Card.css';

function Card({ suit, rank, isSelected, onClick }) {
  // Use '10' for rank 'T', and handle other ranks as is
  const displayRank = rank === 'T' ? '10' : rank;
  const cardImagePath = `assets/cards/${displayRank}_of_${suit}.svg`;
  
  return (
    <div className={`card ${isSelected ? 'selected' : ''}`} onClick={onClick}>
      <div className="card-inner">
        <div className="card-front">
          <img src={cardImagePath} alt={`${rank} of ${suit}`} className="card-face-img" />
        </div>
        <div className="card-back">
          <div className="card-back-pattern"></div>
        </div>
      </div>
    </div>
  );
}

export default Card;
