// src/components/ui/Card.js

import React from 'react';
import { getCardImageUrl } from '../../utils/game/cardImage';
import '../../styles/Card.css'; // [修改] 引用新的样式文件

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