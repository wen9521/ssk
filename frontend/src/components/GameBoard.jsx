// src/components/GameBoard.jsx
import React, { useState, useEffect } from 'react';
import Card from './Card';
import { STAGES } from '../utils/store'; 

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

export default function GameBoard({ 
  players, 
  myPlayerId, 
  stage, 
  onReady, 
  onCompare, 
  onRestart, 
  onQuit, 
  onUpdateHands, 
  onAutoSplit, 
  gameMode = 'thirteen-cards' 
}) {
    const me = players.find(p => p.id === myPlayerId);
    
    const [selectedCards, setSelectedCards] = useState([]);
    const [draggedCards, setDraggedCards] = useState(null);
    const [dragOverArea, setDragOverArea] = useState(null);
    const [showResult, setShowResult] = useState(false);

    const isEightCardsMode = gameMode === 'eight-cards';
    // 核心修复：手动理牌的条件是：十三水模式、游戏在玩、且玩家自己尚未提交
    const canManualSplit = !isEightCardsMode && stage === STAGES.PLAYING && !me?.submitted;

    useEffect(() => {
        if (stage === STAGES.FINISHED) {
          setShowResult(true);
          const timer = setTimeout(() => {
            setShowResult(false);
            if(onRestart) onRestart();
          }, 10000);
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

    const handleCardClick = (card, area, event) => {
        if (!canManualSplit) return;
        const cardId = `${card.rank}_${card.suit}`;
        const isSelected = selectedCards.some(c => c.id === cardId);
        if (event.shiftKey) {
          setSelectedCards(prev => isSelected ? prev.filter(c => c.id !== cardId) : [...prev, { ...card, area, id: cardId }]);
        } else {
          setSelectedCards(isSelected && selectedCards.length === 1 ? [] : [{ ...card, area, id: cardId }]);
        }
    };
    
    const handleDragStart = (e, card, area) => {
        if (!canManualSplit) return;
        const cardId = `${card.rank}_${card.suit}`;
        let cardsToDrag = selectedCards.some(c => c.id === cardId) ? selectedCards : [{ ...card, area, id: cardId }];
        if (!selectedCards.some(c => c.id === cardId)) {
            setSelectedCards(cardsToDrag);
        }
        setDraggedCards(cardsToDrag);
        e.dataTransfer.setData("text/plain", JSON.stringify(cardsToDrag));
    };
    
    const handleDrop = (e, toArea) => {
        if (!canManualSplit || !draggedCards) return;
        e.preventDefault();
        setDragOverArea(null);
        const draggedData = JSON.parse(e.dataTransfer.getData("text/plain"));
        
        let hands = { head: [...(me.head || [])], middle: [...(me.middle || [])], tail: [...(me.tail || [])] };
        
        draggedData.forEach(dragged => {
          for (const areaName in hands) {
            hands[areaName] = hands[areaName].filter(c => !(c.rank === dragged.rank && c.suit === dragged.suit));
          }
        });
    
        draggedData.forEach(dragged => {
          hands[toArea].push({ rank: dragged.rank, suit: dragged.suit });
        });
        
        hands.head = sortHandInternal(hands.head);
        hands.middle = sortHandInternal(hands.middle);
        hands.tail = sortHandInternal(hands.tail);
    
        if(onUpdateHands) onUpdateHands(myPlayerId, hands);
        setSelectedCards([]);
        setDraggedCards(null);
    };

    const renderSeat = (p) => (
        <div key={p.id} className={`player-seat ${p.id === myPlayerId ? 'player-me' : ''}`}>
          <div className="player-name">{p.name}</div>
          <div className={`player-status ${p.submitted ? 'ready' : ''}`}>
             {p.submitted ? '已理牌' : (p.isReady ? (p.isAI ? '思考中...' : '理牌中...') : '等待中')}
          </div>
        </div>
      );

    const renderPile = (cards, label, area) => {
        const isFoulPile = me?.isFoul && (area === 'head' || area === 'middle' || area === 'tail');
        return (
            <div
                className={`pai-dun ${dragOverArea === area && canManualSplit ? 'drag-over' : ''} ${isFoulPile ? 'foul' : ''}`}
                onDragOver={(e) => { if (canManualSplit) { e.preventDefault(); setDragOverArea(area); } }}
                onDragLeave={() => setDragOverArea(null)}
                onDrop={(e) => handleDrop(e, area)}
            >
                <div className="card-display-area">
                    {(cards || []).map((card, i) => {
                        const cardId = `${card.rank}_${card.suit}`;
                        const isSelected = selectedCards.some(c => c.id === cardId);
                        const isDragging = draggedCards?.some(c => c.id === cardId) ?? false;
                        return (
                            <div
                                key={`${cardId}_${area}_${i}`}
                                className="card-wrapper-dun"
                                style={{ zIndex: isSelected ? 100 + i : i }}
                                draggable={canManualSplit}
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
                    })}
                </div>
                <div className="pai-dun-label">{label} ({(cards || []).length})</div>
            </div>
        );
    };

    const renderResultModal = () => { /* 保持不变 */ };
    
    if (!me) {
        return <div>加载中...</div>;
    }
    
    // 核心修复：“开始比牌”按钮的可用条件
    const isReadyForCompare = stage === STAGES.PLAYING &&
        !me.submitted &&
        me.head?.length === 3 &&
        me.middle?.length === 5 &&
        me.tail?.length === 5;

    // 渲染根组件
    return (
        <>
            <div className="game-header">
                <button className="btn-quit" onClick={onQuit}>
                    {'< 退出房间'}
                </button>
                <div className="score-display">
                    积分: {me.points}
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
                    disabled={stage !== STAGES.LOBBY || me.submitted}
                >
                    {me.isReady ? '取消准备' : '准备'}
                </button>
                <button 
                    className="btn-action" 
                    data-type="smart"
                    onClick={() => onAutoSplit(myPlayerId)}
                    disabled={!canManualSplit || !onAutoSplit}
                >
                    智能分牌
                </button>
                <button 
                    className="btn-action" 
                    data-type="compare" 
                    onClick={onCompare} 
                    disabled={!isReadyForCompare}
                >
                    开始比牌
                </button>
            </div>
            
            {renderResultModal()}
        </>
    );
}
