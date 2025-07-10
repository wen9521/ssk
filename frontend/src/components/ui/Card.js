import React from 'react';
import { getCardImageUrl } from '../../utils/game/cardImage';
import '../../styles/Card.css';

const Card = ({ card, isSelected, onCardClick }) => {
  const classNames = `card-image ${isSelected ? 'selected' : ''}`;

  return (
    <img
      src={getCardImageUrl(card)}
      alt={card}
      className={classNames}
      onClick={() => onCardClick && onCardClick(card)}
    />
  );
};

export default Card;