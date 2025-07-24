import React from 'react';

function Card({ suit, rank }) {
  const cardImagePath = `assets/cards/${rank}_of_${suit}.svg`;

  return (
    <img 
      src={cardImagePath} 
      alt={`${rank} of ${suit}`} 
      style={{ width: '50px', height: '70px' }} 
    />
  );
}

export default Card;
