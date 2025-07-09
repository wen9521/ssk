import React from 'react';
import { getCardImageUrl } from '../../utils/game/cardImage';

export default function Card({ card }) {
  return (
    <img
      src={getCardImageUrl(card)}
      alt={card}
      style={{
        width: '80px', // Make it a bit larger
        height: '112px', // Maintain aspect ratio (approx. 1:1.4)
        margin: '4px', // Increase margin slightly
        border: '1px solid #ccc', // Add a subtle border
        borderRadius: '5px', // Add rounded corners
        boxShadow: '2px 2px 5px rgba(0, 0, 0, 0.3)', // Add a small box shadow
        objectFit: 'cover', // Ensure the image covers the area
      }}
      onError={e => e.target.src='/cards/unknown.svg'}
    />
  );
}