// src/components/Card.jsx
import React from 'react';
import './Card.css';
import { cardToImageName, cardToDisplayName } from '../utils/card-utils';

const Card = React.memo(({ card, isSelected, isDragging, onClick }) => {
  if (!card) {
    return <div className="card-container empty"></div>;
  }

  const imageName = cardToImageName(card);
  const displayName = cardToDisplayName(card);
  const imageUrl = `${process.env.PUBLIC_URL}/assets/cards/${imageName}`;

  const containerClasses = [
    'card-container',
    isSelected ? 'is-selected' : '',
    isDragging ? 'is-dragging' : ''
  ].join(' ').trim();

  return (
    <div className={containerClasses} onClick={onClick}>
      <img
        src={imageUrl}
        alt={displayName}
        className="card-image"
        draggable="false" 
      />
    </div>
  );
});

export default Card;
