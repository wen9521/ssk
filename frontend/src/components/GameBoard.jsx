// frontend/src/components/GameBoard.jsx (主题化文本增强版)

import React, { useState, useEffect, useRef } from 'react';
import Card from './Card';
import { STAGES } from '../utils/store';

// 排序函数（保持不变）
const ranks = ['2','3','4','5','6','7','8','9','T','J','Q','K','A'];
const suits = ['diamonds','clubs','hearts','spades'];
const sortHand = (hand) => {
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

  // State for interaction
  const [selectedCards, setSelectedCards] = useState([]);
  const [draggedCard, setDraggedCard] = useState(null);
  const [dragOverArea, setDragOverArea] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const playerHands = useRef({ head: [], middle: [], tail: [] });

  useEffect(() => {
    if (me && me.head) {
      playerHands.current = { head: me.head, middle: me.middle, tail: me.tail };
    }
  }, [me]);

  useEffect(() => {
    if (stage === STAGES.FINISHED) {
      setShowResult(true);
      const timer = setTimeout(() => {
        setShowResult(false);
        onRestart();
      }, 8000);
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

  // --- 交互逻辑 (保持不变) ---
  const handleCardClick = (card, area, event) => {
    if (stage !== STAGES.PLAYING) return;
    const cardId = `${card.rank}_${card.suit}`;
    const isSelected = selectedCards.some(c => c.id === cardId);
    if (event.shiftKey) {
      if (isSelected) {
        setSelectedCards(selectedCards.filter(c => c.id !== cardId));
      } else {
        setSelectedCards([...selectedCards, { ...card, area, id: cardId }]);
      }
    } else {
      if (isSelected && selectedCards.length === 1) {
        setSelectedCards([]);
      } else {
        setSelectedCards([{ ...card, area, id: cardId }]);
      }
    }
  };

  const handleDragStart = (e, card, area) => {
    if (stage !== STAGES.PLAYING) return;
    const cardId = `${card.rank}_${card.suit}`;
    if (!selectedCards.some(c => c.id === cardId)) {
      setSelectedCards([{ ...card, area, id: cardId }]);
      setDraggedCard([{ ...card, area, id: cardId }]);
      e.dataTransfer.setData("text/plain", JSON.stringify([{ ...card, area, id: cardId }]));
    } else {
      setDraggedCard(selectedCards);
      e.dataTransfer.setData("text/plain", JSON.stringify(selectedCards));
    }
    setTimeout(() => e.target.closest('.card-wrapper-dun').style.opacity = '0.5', 0);
  };
  
  const handleDragEnd = (e) => {
     e.target.closest('.card-wrapper-dun').style.opacity = '1';
     setDraggedCard(null);
  };

  const handleDrop = (e, toArea) => {
    if (stage !== STAGES.PLAYING || !draggedCard) return;
    setDragOverArea(null);
    const draggedCards = JSON.parse(e.dataTransfer.getData("text/plain"));
    let hands = { head: [...me.head], middle: [...me.middle], tail: [...me.tail] };
    draggedCards.forEach(dragged => {
      const fromArea = dragged.area;
      if (fromArea !== toArea) {
        hands[fromArea] = hands[fromArea].filter(c => !(c.rank === dragged.rank && c.suit === dragged.suit));
        hands[toArea].push({ rank: dragged.rank, suit: dragged.suit });
      }
    });
    hands.head = sortHand(hands.head);
    hands.middle = sortHand(hands.middle);
    hands.tail = sortHand(hands.tail);
    onUpdateHands(hands);
    setSelectedCards([]);
  };

  // --- 渲染逻辑 ---

  const renderSeat = (p) => (
    <div key={p.id} className={`player-seat ${p.id === myPlayerId ? 'player-me' : ''}`}>
      <div>{p.name}</div>
      <div className={`player-status ${p.isReady || p.submitted ? 'ready' : ''}`}>
        {p.submitted ? '已出牌' : p.isReady ? '已就绪' : '分析中...'}
      </div>
    </div>
  );

  const renderPile = (cards, label, area) => (
    <div
      className={`pai-dun ${dragOverArea === area ? 'drag-over' : ''} ${me.isFoul && (area === 'head' || area === 'middle' || area === 'tail') ? 'is-foul' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragOverArea(area); }}
      onDragLeave={() => setDragOverArea(null)}
      onDrop={(e) => handleDrop(e, area)}
    >
      <div className="pai-dun-content">
        {(cards && cards.length > 0) ? cards.map((card, i) => {
            const cardId = `${card.rank}_${card.suit}`;
            const isSelected = selectedCards.some(c => c.id === cardId);
            const isDragging = draggedCard?.some(c => c.id === cardId) ?? false;
            return (
              <div
                key={cardId + '_' + area}
                className="card-wrapper-dun"
                style={{ '--card-index': i, zIndex: isSelected ? 100 + i : i }}
                draggable="true"
                onDragStart={(e) => handleDragStart(e, card, area)}
                onDragEnd={handleDragEnd}
              >
                <Card
                  card={card}
                  isSelected={isSelected}
                  isDragging={isDragging}
                  onClick={(e) => handleCardClick(card, area, e)}
                />
              </div>
            );
          }) : (
            <div className="pai-dun-placeholder">{stage === STAGES.LOBBY ? '等待部署' : '空'}</div>
          )
        }
      </div>
      <div className="pai-dun-label">{label} ({cards?.length || 0})</div>
    </div>
  );
  
  const renderResultModal = () => {
     if (!showResult || !players.some(p => p.score != null)) return null;
     
     const renderResultPile = (cards, score, rank) => (
        <div className="result-hand">
            <div className="hand-score">{rank} (得分: {score || 0})</div>
            {(cards || []).map((card, i) => (
                <div key={`${card.rank}_${card.suit}_${i}`} className="card-wrapper-dun" style={{'--card-index': i, zIndex: i }}>
                    <Card card={card} />
                </div>
            ))}
        </div>
    );
    
    return (
        <div className="modal-overlay" onClick={onRestart}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onRestart}>×</button>
                <h2>BATTLE REPORT</h2>
                {players.map(p => (
                    <div key={p.id} className="result-player">
                        <div className={`result-player-header ${p.id === myPlayerId ? 'me' : ''}`}>
                            <span className="player-name">{p.name}</span>
                            {p.isFoul && <span className="foul-tag">(阵型溃败)</span>}
                            <span className="player-score" data-positive={p.score > 0}>总分: {p.score > 0 ? '+' : ''}{p.score || 0}</span>
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
                <button className="btn-action btn-ready" onClick={onRestart} style={{gridColumn: '1 / -1', marginTop: '20px'}}>再战一场</button>
            </div>
        </div>
    );
  };
  
  return (
    <div className="play-container">
      <div className="game-wrapper">
        <div className="game-header">
          <button className="btn-quit" onClick={onQuit}>{'< 撤退'}</button>
          <div className="score-display">
            <span role="img" aria-label="coin">⭐</span> 战绩: {me.points || 0}
          </div>
        </div>
        <div className="players-area">{players.map(renderSeat)}</div>

        {renderPile(me.head, '前锋部队', 'head')}
        {renderPile(me.middle, '核心主力', 'middle')}
        {renderPile(me.tail, '后备支援', 'tail')}

        <div className="actions-area">
          {stage === STAGES.LOBBY && !me.isReady && (
            <button className="btn-action btn-ready" onClick={onReady}>
              {stage === STAGES.DEALING ? '正在部署...' : '部署就绪'}
            </button>
          )}
          {stage === STAGES.PLAYING && (
            <button className="btn-action btn-compare" onClick={onCompare} disabled={me.isFoul}>
              {me.isFoul ? '阵型错误' : '发动总攻'}
            </button>
          )}
          {stage === STAGES.SUBMITTING && (
            <button className="btn-action btn-compare" disabled>战况分析中...</button>
          )}
        </div>
        
        {renderResultModal()}
      </div>
    </div>
  );
}
