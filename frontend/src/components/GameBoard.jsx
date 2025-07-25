// frontend/src/components/GameBoard.jsx (全新布局 V3)
import React, { useState, useEffect } from 'react';
import Card from './Card';
import Hand from './Hand'; // 引入新的手牌组件
import { STAGES } from '../utils/store';

export default function GameBoard({ players, myPlayerId, stage, onReady, onCompare, onRestart, onQuit, onUpdateHands }) {
  const me = players.find(p => p.id === myPlayerId);

  const [selectedCards, setSelectedCards] = useState([]);
  const [draggedCards, setDraggedCards] = useState(null);
  const [dragOverArea, setDragOverArea] = useState(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (stage === STAGES.FINISHED) {
      setShowResult(true);
      const timer = setTimeout(() => {
        setShowResult(false);
        onRestart();
      }, 10000); // 延长显示时间
      return () => clearTimeout(timer);
    } else {
      setShowResult(false);
    }
  }, [stage, onRestart]);
  
  useEffect(() => {
    if (stage !== STAGES.PLAYING) {
        setSelectedCards([]);
    }
  }, [stage]);

  // --- 卡牌交互逻辑 ---
  const handleCardClick = (card, area, event) => {
    if (stage !== STAGES.PLAYING || !me) return;

    const cardId = `${card.rank}_${card.suit}`;
    const sourceArea = area || findCardArea(cardId);
    if (!sourceArea) return;
    
    const isSelected = selectedCards.some(c => c.id === cardId);

    if (event.shiftKey) {
      setSelectedCards(prev => 
        isSelected ? prev.filter(c => c.id !== cardId) : [...prev, { ...card, area: sourceArea, id: cardId }]
      );
    } else {
      setSelectedCards(
        isSelected && selectedCards.length === 1 ? [] : [{ ...card, area: sourceArea, id: cardId }]
      );
    }
  };

  const findCardArea = (cardId) => {
    const cardRank = cardId.split('_')[0];
    const cardSuit = cardId.split('_of_')[1];
    
    for (const area of ['head', 'middle', 'tail', 'hand']) {
      if (me[area]?.some(c => c.rank.toLowerCase() === cardRank && c.suit === cardSuit)) {
        return area;
      }
    }
    return null;
  };

  const handleDragStart = (e, card, area) => {
    if (stage !== STAGES.PLAYING) return;
    const cardId = `${card.rank}_${card.suit}`;
    const sourceArea = area || findCardArea(cardId);
    
    let cardsToDrag;
    if (selectedCards.some(c => c.id === cardId)) {
      cardsToDrag = selectedCards;
    } else {
      cardsToDrag = [{ ...card, area: sourceArea, id: cardId }];
      setSelectedCards(cardsToDrag);
    }
    
    setDraggedCards(cardsToDrag);
    e.dataTransfer.setData("text/plain", JSON.stringify(cardsToDrag));
    
    // 隐藏拖拽源的视觉效果由CSS处理
  };

  const handleDrop = (e, toArea) => {
    if (stage !== STAGES.PLAYING || !draggedCards) return;
    
    e.preventDefault();
    setDragOverArea(null);
    const draggedData = JSON.parse(e.dataTransfer.getData("text/plain"));
    
    let hands = { head: [...me.head], middle: [...me.middle], tail: [...me.tail], hand: [...me.hand] };

    draggedData.forEach(dragged => {
      const fromArea = dragged.area;
      if (fromArea !== toArea) {
        hands[fromArea] = hands[fromArea].filter(c => !(c.rank === dragged.rank && c.suit === dragged.suit));
        hands[toArea].push({ rank: dragged.rank, suit: dragged.suit });
      }
    });

    onUpdateHands(hands);
    setSelectedCards([]);
    setDraggedCards(null);
  };
  
  // --- 渲染逻辑 ---
  const renderSeat = (p) => (
    <div key={p.id} className={`player-seat ${p.id === myPlayerId ? 'player-me' : ''}`}>
      <div className="player-name">{p.name}</div>
      <div className={`player-status ${p.isReady || p.submitted ? 'ready' : ''}`}>
        {p.submitted ? '指令已确认' : p.isReady ? '已就绪' : '等待中...'}
      </div>
    </div>
  );

  const renderPile = (cards, label, area) => (
    <div className="deployment-slot-wrapper">
      <div
        className={`deployment-slot ${dragOverArea === area ? 'drag-over' : ''} ${me.isFoul && area !== 'hand' ? 'is-foul' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOverArea(area); }}
        onDragLeave={() => setDragOverArea(null)}
        onDrop={(e) => handleDrop(e, area)}
      >
        <div className="slot-label">{label} <span>[{cards?.length || 0}]</span></div>
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
            }) : ( <div className="slot-placeholder">部署区域</div> )
          }
        </div>
      </div>
    </div>
  );
  
  const renderResultModal = () => { /* ... (此处代码与上个回复中的保持一致) ... */ };
  
  if (!me) {
    return <div>正在连接指挥系统...</div>;
  }

  return (
    <div className="game-board-container">
      <div className="game-board-top">
        <button className="btn-quit" onClick={onQuit}>{'< 撤退'}</button>
        <div className="players-area">{players.map(renderSeat)}</div>
        <div className="score-display">战绩: {me.points || 0}</div>
      </div>

      <div className="deployment-slots">
        {renderPile(me.head, '前锋', 'head')}
        {renderPile(me.middle, '中坚', 'middle')}
        {renderPile(me.tail, '后卫', 'tail')}
      </div>

      <div className="player-command-area">
        <Hand
          cards={me.hand}
          selectedCards={selectedCards}
          draggedCards={draggedCards}
          onCardClick={handleCardClick}
          onDragStart={handleDragStart}
          onDragEnd={() => setDraggedCards(null)}
          onDrop={(e) => handleDrop(e, 'hand')}
        />
        <div className="actions-area">
           {stage === STAGES.LOBBY && !me.isReady && (
            <button className="btn-action btn-ready" onClick={onReady}>
              {stage === STAGES.DEALING ? '部署中...' : '准备部署'}
            </button>
          )}
          {stage === STAGES.PLAYING && (
            <button className="btn-action btn-compare" onClick={onCompare} disabled={me.isFoul || me.hand?.length > 0}>
              {me.isFoul ? '阵型错误' : me.hand?.length > 0 ? '未完成部署' : '确认指令'}
            </button>
          )}
          {stage === STAGES.SUBMITTING && (
            <button className="btn-action" disabled>正在执行...</button>
          )}
        </div>
      </div>
      
      {renderResultModal()}
    </div>
  );
}
