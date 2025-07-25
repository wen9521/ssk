// frontend/src/components/Card.jsx (科技感重构)
import React from 'react';
import './Card.css';

// SVG 符号, 极具科技感
const SUIT_SYMBOLS = {
  spades: (props) => <path d="M60 20 L75 40 L60 100 L45 40 Z M60 80 L90 110 L30 110 Z" {...props} />,
  hearts: (props) => <path d="M60 40 A20 20 0 0 1 90 60 A20 20 0 0 1 60 100 A20 20 0 0 1 30 60 A20 20 0 0 1 60 40" {...props} />,
  clubs: (props) => <path d="M60 25 A20 20 0 1 1 60 65 A20 20 0 1 1 60 25 M40 60 A20 20 0 1 1 40 100 A20 20 0 1 1 40 60 M80 60 A20 20 0 1 1 80 100 A20 20 0 1 1 80 60 M60 70 L60 110" {...props} />,
  diamonds: (props) => <path d="M60 20 L90 65 L60 110 L30 65 Z" {...props} />,
};

const Card = React.memo(({ card, isSelected, isDragging, onClick }) => {
  if (!card) return <div className="card-container empty"></div>;

  const { rank, suit } = card;
  const suitColor = (suit === 'hearts' || suit === 'diamonds') ? 'var(--secondary-glow)' : 'var(--primary-glow)';
  const SuitIcon = SUIT_SYMBOLS[suit];

  const containerClasses = [
    'card-container',
    isSelected ? 'is-selected' : '',
    isDragging ? 'is-dragging' : ''
  ].join(' ').trim();

  return (
    <div className={containerClasses} onClick={onClick}>
      <div className="card-border">
        <div className="card-glow"></div>
        <div className="card-content">
          <div className="card-corner top-left" style={{ color: suitColor }}>
            <span className="rank">{rank}</span>
            <svg className="suit-icon-small" viewBox="0 0 120 120">
              <SuitIcon fill={suitColor} />
            </svg>
          </div>
          <div className="card-corner bottom-right" style={{ color: suitColor }}>
            <span className="rank">{rank}</span>
            <svg className="suit-icon-small" viewBox="0 0 120 120">
              <SuitIcon fill={suitColor} />
            </svg>
          </div>
          <div className="card-center-suit" style={{ color: suitColor }}>
            <svg className="suit-icon-large" viewBox="0 0 120 120">
                <SuitIcon fill="none" stroke={suitColor} strokeWidth="5" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
});

export default Card;
