// frontend/src/components/GameBoard.jsx (Glassmorphism 布局)
import React, { useState, useEffect } from 'react';
import Card from './Card';
import { STAGES } from '../utils/store';

// 排序函数可以保留，因为AI理牌和某些逻辑可能还需要
// ... sortHand function from your file ...

export default function GameBoard({ players, myPlayerId, stage, onReady, onCompare, onRestart, onQuit, onUpdateHands }) {
  const me = players.find(p => p.id === myPlayerId);

  const [selectedCards, setSelectedCards] = useState([]);
  const [draggedCards, setDraggedCards] = useState(null);
  const [dragOverArea, setDragOverArea] = useState(null);
  const [showResult, setShowResult] = useState(false);
  
  // ... useEffect hooks can remain the same ...

  const handleCardClick = (card, area, event) => {
    // ... logic remains the same ...
  };
  const handleDragStart = (e, card, area) => {
    // ... logic remains the same ...
  };
  const handleDrop = (e, toArea) => {
    // ... logic remains the same, but now it only moves between head, middle, tail
  };
  
  // ... other handlers can remain the same ...
  
  const renderSeat = (p) => (
    <div key={p.id} className={`player-seat ${p.id === myPlayerId ? 'player-me' : ''}`}>
      <div className="player-name">{p.name}</div>
      <div className={`player-status ${p.submitted || p.isReady ? 'ready' : ''}`}>
        {p.submitted ? '已理牌' : (p.isReady ? (p.isAI ? '已理牌' : '已准备') : '等待中')}
      </div>
    </div>
  );

  const renderPile = (cards, label, area) => (
    <div
      className={`pai-dun ${dragOverArea === area ? 'drag-over' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragOverArea(area); }}
      onDragLeave={() => setDragOverArea(null)}
      onDrop={(e) => handleDrop(e, area)}
    >
      <div className="card-display-area">
        {(cards && cards.length > 0) ? cards.map((card, i) => {
          const cardId = `${card.rank}_${card.suit}`;
          const isSelected = selectedCards.some(c => c.id === cardId);
          const isDragging = draggedCards?.some(c => c.id === cardId) ?? false;
          return (
            <div
              key={cardId + '_' + area}
              className="card-wrapper-dun"
              draggable="true"
              onDragStart={(e) => handleDragStart(e, card, area)}
              onDragEnd={() => setDraggedCards(null)}
            >
              <Card
                card={card}
                isSelected={isSelected}
                isDragging={isDragging}
                onClick={(e) => handleCardClick(card, area, e)}
              />
            </div>
          );
        }) : null}
      </div>
      <div className="pai-dun-label">{label} ({cards?.length || 0})</div>
    </div>
  );
  
  const renderResultModal = () => { /* ... 此处代码可复用，样式已在Play.css中适配 ... */ };

  if (!me) return <div>加载中...</div>;

  return (
    <div className="play-container">
      <div className="game-wrapper">
        <div className="game-header">
          <button className="btn-quit" onClick={onQuit}>< 退出房间</button>
          <div className="score-display">
            <span className="coin-icon">1</span>
            积分: {me.points || 100} {/* 示例积分 */}
          </div>
        </div>
        <div className="players-area">{players.map(renderSeat)}</div>
        <div className="deployment-slots">
          {renderPile(me.head, '头道', 'head')}
          {renderPile(me.middle, '中道', 'middle')}
          {renderPile(me.tail, '尾道', 'tail')}
        </div>
        <div className="actions-area">
          <button className="btn-action" data-type="cancel" onClick={onReady}>
            {me.isReady ? '取消准备' : '准备'}
          </button>
          <button className="btn-action" data-type="smart">智能分牌</button>
          <button className="btn-action" data-type="compare" onClick={onCompare} disabled={!me.isReady}>
            开始比牌
          </button>
        </div>
        {renderResultModal()}
      </div>
    </div>
  );
}
