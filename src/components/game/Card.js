jsx
import React from 'react';
import { getCardImageUrl } from '../../utils/game/cardImage';

export default function Card({ card }) {
  // 响应式卡片尺寸
  const isMobile = window.innerWidth <= 768;
  const width = isMobile ? '60px' : '80px';
  const height = isMobile ? '84px' : '112px'; // 保持宽高比

  return (
    <img
      src={getCardImageUrl(card)}
      alt={card}
      style={{
        width: width,
        height: height,
        margin: isMobile ? '2px' : '4px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '8px',
        boxShadow: '0 3px 8px rgba(0, 0, 0, 0.3)',
        objectFit: 'cover',
        background: '#fff',
      }}
      onError={e => e.target.src='/cards/red_joker.svg'}
    />
  );
}