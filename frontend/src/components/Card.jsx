// frontend/src/components/Card.jsx (使用SVG图片版本)
import React from 'react';
import './Card.css';
import { cardToImageName, cardToDisplayName } from '../utils/card-utils'; // 导入工具函数

const Card = React.memo(({ card, isSelected, isDragging, onClick }) => {
  // 如果没有卡牌数据，渲染一个空的占位符
  if (!card) {
    return <div className="card-container empty"></div>;
  }

  // 使用工具函数获取图片名和显示名
  const imageName = cardToImageName(card);
  const displayName = cardToDisplayName(card);
  
  // 图片的完整路径
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
        // draggable="false" 阻止了图片的默认拖拽行为，
        // 这样我们自定义的 onDragStart 才能更好地工作
        draggable="false" 
      />
    </div>
  );
});

export default Card;
