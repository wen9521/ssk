// frontend/src/components/GameBoard.jsx (最终修正版)

import React, 'react';
import { useState, useEffect } from 'react';
import Card from './Card';
import { STAGES } from '../utils/store';

// 排序函数，用于对AI的手牌进行内部排序，确保一致性
const ranks = ['2','3','4','5','6','7','8','9','T','J','Q','K','A'];
const suits = ['diamonds','clubs','hearts','spades'];
const sortHandInternal = (hand) => {
  if (!Array.isArray(hand)) return [];
  return [...hand].sort((a, b) => {
    const rA = ranks.indexOf(a.rank);
    const rB = ranks.indexOf(b.rank);
    if (rA !== rB) return rA - rB;
    return suits.indexOf(a.suit) - suits.indexOf(b.suit);
  });
};


export default function GameBoard({ players, myPlayerId, stage, onReady, onCompare, onRestart, onQuit, onUpdateHands }) {
  const me = players.find(p => p.id === myPlayerId);

  const [selectedCards, setSelectedCards] = useState([]);
  const [draggedCards, setDraggedCards] = useState(null);
  const [dragOverArea, setDragOverArea] = useState(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (stage === STAGES.FINISHED) {
      setShowResult(true);
      // 结果显示10秒后自动重启
      const timer = setTimeout(() => {
        setShowResult(false);
        onRestart();
      }, 10000);
      return () => clearTimeout(timer);
    } else {
      setShowResult(false);
    }
  }, [stage, onRestart]);

  useEffect(() => {
    // 切换阶段时清空选择
    if (stage !== STAGES.PLAYING) {
      setSelectedCards([]);
    }
  }, [stage]);

  // --- 卡牌交互逻辑 ---

  const handleCardClick = (card, area, event) => {
    if (stage !== STAGES.PLAYING || !me) return;

    const cardId = `${card.rank}_${card.suit}`;
    const isSelected = selectedCards.some(c => c.id === cardId);

    // Shift多选
    if (event.shiftKey) {
      setSelectedCards(prev => 
        isSelected 
          ? prev.filter(c => c.id !== cardId) 
          : [...prev, { ...card, area, id: cardId }]
      );
    } else { // 单选
      setSelectedCards(
        isSelected && selectedCards.length === 1 
          ? [] 
          : [{ ...card, area, id: cardId }]
      );
    }
  };

  const handleDragStart = (e, card, area) => {
    if (stage !== STAGES.PLAYING) return;
    const cardId = `${card.rank}_${card.suit}`;
    
    let cardsToDrag;
    // 如果拖拽的牌已被选中，则拖拽所有选中的牌
    if (selectedCards.some(c => c.id === cardId)) {
      cardsToDrag = selectedCards;
    } else {
      // 否则，只拖拽当前这张牌
      cardsToDrag = [{ ...card, area, id: cardId }];
      setSelectedCards(cardsToDrag); // 并将其设为当前选中
    }
    
    setDraggedCards(cardsToDrag);
    e.dataTransfer.setData("text/plain", JSON.stringify(cardsToDrag));
  };

  const handleDrop = (e, toArea) => {
    if (stage !== STAGES.PLAYING || !draggedCards) return;
    
    e.preventDefault();
    setDragOverArea(null);
    const draggedData = JSON.parse(e.dataTransfer.getData("text/plain"));
    
    // 创建当前牌墩的副本
    let hands = { 
      head: [...me.head], 
      middle: [...me.middle], 
      tail: [...me.tail] 
    };

    // 1. 从所有牌墩中移除被拖拽的牌
    draggedData.forEach(dragged => {
      for (const area in hands) {
        hands[area] = hands[area].filter(c => !(c.rank === dragged.rank && c.suit === dragged.suit));
      }
    });

    // 2. 将被拖拽的牌加入目标牌墩
    draggedData.forEach(dragged => {
      hands[toArea].push({ rank: dragged.rank, suit: dragged.suit });
    });

    // 3. 对所有牌墩进行内部排序并更新状态
    hands.head = sortHandInternal(hands.head);
    hands.middle = sortHandInternal(hands.middle);
    hands.tail = sortHandInternal(hands.tail);

    onUpdateHands(hands);
    setSelectedCards([]);
    setDraggedCards(null);
  };
  
  // --- 渲染逻辑 ---

  const renderSeat = (p) => (
    <div key={p.id} className={`player-seat ${p.id === myPlayerId ? 'player-me' : ''}`}>
      <div className="player-name">{p.name}</div>
      <div className={`player-status ${p.submitted || (p.isReady && stage !== STAGES.LOBBY) ? 'ready' : ''}`}>
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
              style={{ zIndex: isSelected ? 100 + i : i }}
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
  
  const renderResultModal = () => {
    if (!showResult || !players.some(p => p.score != null)) return null;

    const renderResultPile = (cards, score, rank) => (
        <div className="result-hand">
            <div className="hand-score">{rank} (得分: {score || 0})</div>
            <div className="hand-cards-display">
              {(cards || []).map((card, i) => (
                  <div key={`${card.rank}_${card.suit}_${i}`} className="card-wrapper-dun">
                      <Card card={card} />
                  </div>
              ))}
            </div>
        </div>
    );

    return (
        <div className="modal-overlay" onClick={onRestart}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onRestart}>×</button>
                <h2>对局结果</h2>
                {players.map(p => (
                    <div key={p.id} className="result-player">
                        <div className={`result-player-header ${p.id === myPlayerId ? 'me' : ''}`}>
                            <span className="player-name">{p.name}</span>
                            {p.isFoul && <span className="foul-tag">(倒水)</span>}
                            <span className="player-score" data-positive={p.score > 0}>
                              总分: {p.score > 0 ? '+' : ''}{p.score || 0}
                            </span>
                        </div>
                        {p.handDetails && (
                            <>
                                {renderResultPile(p.head, p.handDetails.head.score, p.handDetails.head.rank)}
                                {renderResultPile(p.middle, p.handDetails.middle.score, p.handDetails.middle.rank)}
                                {renderResultPile(p.tail, p.handDetails.tail.score, p.handDetails.tail.rank)}
                            </>
                        )}
                    </div>
                ))}
                <button 
                  className="btn-action" 
                  data-type="smart" 
                  onClick={onRestart} 
                  style={{gridColumn: '1 / -1', marginTop: '20px'}}
                >
                  再来一局
                </button>
            </div>
        </div>
    );
  };

  if (!me) return <div>加载中...</div>;

  return (
    <div className="play-container">
      <div className="game-wrapper">
        <div className="game-header">
          <button className="btn-quit" onClick={onQuit}>< 退出房间</button>
          <div className="score-display">
            <div className="coin-icon">1</div>
            积分: {me.points || 100}
          </div>
        </div>

        <div className="players-area">{players.map(renderSeat)}</div>

        <div className="deployment-slots">
          {renderPile(me.head, '头道', 'head')}
          {renderPile(me.middle, '中道', 'middle')}
          {renderPile(me.tail, '尾道', 'tail')}
        </div>

        <div className="actions-area">
          <button 
            className="btn-action" 
            data-type="cancel" 
            onClick={onReady}
            disabled={stage !== STAGES.LOBBY}
          >
            {me.isReady ? '取消准备' : '准备'}
          </button>
          <button 
            className="btn-action" 
            data-type="smart"
            disabled={stage !== STAGES.PLAYING}
          >
            智能分牌
          </button>
          <button 
            className="btn-action" 
            data-type="compare" 
            onClick={onCompare} 
            disabled={stage !== STAGES.PLAYING || !me.isReady}
          >
            开始比牌
          </button>
        </div>
        
        {renderResultModal()}
      </div>
    </div>
  );
}
