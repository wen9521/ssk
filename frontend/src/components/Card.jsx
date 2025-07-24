import React from 'react';
import './Card.css';

function Card({ suit, rank, isSelected, onClick }) {
  const getDisplayRank = (rank) => {
    switch (rank) {
      case 'A': return 'ace';
      case 'K': return 'king';
      case 'Q': return 'queen';
      case 'J': return 'jack';
      case 'T': return '10';
      default: return rank;
    }
  };

  const displayRank = getDisplayRank(rank);
  // 使用 process.env.PUBLIC_URL 来确保无论部署在哪里，都能正确找到 public 目录下的资源
  const cardImagePath = `${process.env.PUBLIC_URL}/assets/cards/${displayRank}_of_${suit}.svg`;

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
