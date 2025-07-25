// frontend/src/components/Card.jsx (图片卡牌版本)
import React from 'react';
import './Card.css';

/**
 * 将卡牌对象转换为图片文件名 (e.g., king_of_spades.svg)
 * @param {{rank: string, suit: string}} card - 卡牌对象
 * @returns {string} - 图片文件名
 */
function cardToImageName(card) {
  if (!card || !card.rank || !card.suit) return 'placeholder.svg';
  const rankMap = { 'A': 'ace', 'K': 'king', 'Q': 'queen', 'J': 'jack', 'T': '10' };
  const rankStr = rankMap[card.rank] || card.rank;
  return `${rankStr.toLowerCase()}_of_${card.suit}.svg`;
}

/**
 * 将卡牌对象转换为可读的名称 (e.g., "黑桃K")
 * @param {{rank: string, suit: string}} card - 卡牌对象
 * @returns {string} - 中文名
 */
function cardToDisplayName({ rank, suit }) {
  const suitMap = { spades: '黑桃', hearts: '红桃', clubs: '梅花', diamonds: '方块' };
  return `${suitMap[suit] || ''}${rank || ''}`;
}

const Card = React.memo(({ card, isSelected, isDragging, onClick }) => {
  if (!card) return <div className="card-container empty"></div>;

  const imageName = cardToImageName(card);
  const displayName = cardToDisplayName(card);

  const containerClasses = [
    'card-container',
    isSelected ? 'is-selected' : '',
    isDragging ? 'is-dragging' : ''
  ].join(' ').trim();

  return (
    <div className={containerClasses} onClick={onClick}>
      <img
        src={`${process.env.PUBLIC_URL}/cards/${imageName}`}
        alt={displayName}
        className="card-image"
        draggable="false" // 防止图片自身的拖拽行为
      />
    </div>
  );
});

export default Card;
