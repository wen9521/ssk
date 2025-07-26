import React from 'react';
import { getCardImage } from '../../utils/card-utils';
import './Card.css';

export default function Card({ rank, suit, code }) {
  const imgSrc = code
    ? getCardImage(code)
    : getCardImage({ rank, suit });

  return (
    <div className="card">
      <img src={imgSrc} alt={code || `${rank} of ${suit}`} draggable="false" />
    </div>
  );
}
