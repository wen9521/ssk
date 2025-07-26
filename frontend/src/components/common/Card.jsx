import React from 'react';
import { getCardImage } from '../../utils/card-utils';
import './Card.css'; // 确保这个CSS文件存在并包含 is-selected, is-dragging 等样式

export default function Card({ card, isSelected, isDragging, onClick }) {
  if (!card || !card.rank) {
    // 渲染一个空的占位符或返回null
    return <div className="card-container empty"></div>;
  }
  
  const { rank, suit } = card;
  const imgSrc = getCardImage(card);

  const classNames = [
    'card-container',
    isSelected ? 'is-selected' : '',
    isDragging ? 'is-dragging' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={classNames} onClick={onClick}>
      <img
        src={imgSrc}
        alt={`${rank} of ${suit}`}
        className="card-image"
        draggable="false"
      />
    </div>
  );
}