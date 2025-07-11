import React from 'react';

const Card = ({ card, onClick, isSelected, size = 'normal' }) => {
  const sizeMap = {
    small: { width: 40, height: 60 },
    normal: { width: 60, height: 90 },
    large: { width: 80, height: 120 }
  };
  
  const { width, height } = sizeMap[size];
  
  return (
    <div 
      className={`card ${isSelected ? 'selected' : ''}`}
      onClick={() => onClick && onClick(card)}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundImage: `url(${process.env.PUBLIC_URL}/cards/${card}.svg)`,
        backgroundSize: 'cover',
        borderRadius: '8px',
        boxShadow: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
        margin: '0 2px',
        transform: isSelected ? 'translateY(-10px)' : 'none',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: 'pointer'
      }}
    />
  );
};

export default Card;