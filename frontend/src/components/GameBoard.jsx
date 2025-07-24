// frontend/src/components/GameBoard.jsx

import React, { useState, useEffect } from 'react';
import { SmartSplit } from '../game-logic/ai-logic';
import Card from './Card';
// 不再需要 Hand 组件
// import Hand from './Hand'; 
import './Play.css';

const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
const suits = ['diamonds', 'clubs', 'hearts', 'spades'];

const sortHand = (hand) => {
  if (!hand || !Array.isArray(hand)) return [];
  return [...hand].sort((a, b) => {
    const rankValueA = ranks.indexOf(a.rank);
    const rankValueB = ranks.indexOf(b.rank);
    if (rankValueA !== rankValueB) return rankValueA - rankValueB;
    return suits.indexOf(a.suit) - suits.indexOf(b.suit);
  });
};

const toCardString = (card) => {
  const rankMap = { 'A': 'ace', 'K': 'king', 'Q': 'queen', 'J': 'jack', 'T': '10' };
  const rankStr = rankMap[card.rank] || card.rank.toLowerCase();
  return `${rankStr}_of_${card.suit}`;
};

const toCardObject = (cardStr) => {
  const [rankStr, , suit] = cardStr.split('_');
  const rankMapReverse = { 'ace': 'A', 'king': 'K', 'queen': 'Q', 'jack': 'J', '10': 'T' };
  const rank = rankMapReverse[rankStr] || rankStr;
  return { rank, suit };
};

export default function GameBoard({ players, myPlayerId, onCompare, onRestart, onQuit }) {
  if (!players || players.length === 0) {
    return <div className="play-container"><div className="game-wrapper"><div>Loading Game...</div></div></div>;
  }
  const myPlayer = players.find(p => p.id === myPlayerId);
  if (!myPlayer) {
    return <div className="play-container"><div className="game-wrapper"><div>Initializing player...</div></div></div>;
  }

  // --- State Management ---
  const [head, setHead] = useState([]);
  const [middle, setMiddle] = useState([]);
  const [tail, setTail] = useState([]);
  const [selected, setSelected] = useState({ cards: [], area: null });
  const [draggingCards, setDraggingCards] = useState([]);
  const [dragOverArea, setDragOverArea] = useState(null);
  const [submitMsg, setSubmitMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultModalData, setResultModalData] = useState(null);
  
  // --- Effects ---
  useEffect(() => {
    const freshPlayer = players.find(p => p.id === myPlayerId);
    if (freshPlayer) {
        const allCards = freshPlayer.cards13 || freshPlayer.hand || [];
        if (allCards.length === 13) {
            // *** 核心逻辑：自动分配到牌墩 ***
            const sorted = sortHand(allCards);
            setHead(sorted.slice(0, 3));
            setMiddle(sorted.slice(3, 8));
            setTail(sorted.slice(8, 13));
        } else {
            // 如果是已经分好牌的状态（例如从结果返回）
            setHead(sortHand(freshPlayer.head || []));
            setMiddle(sortHand(freshPlayer.middle || []));
            setTail(sortHand(freshPlayer.tail || []));
        }
        setSelected({ cards: [], area: null });
        setDraggingCards([]);
        setSubmitted(freshPlayer.submitted || false);
        setShowResult(false);
    }
  }, [players, myPlayerId]);

  useEffect(() => { /* showResult logic remains the same */ }, [players]);
  useEffect(() => { /* timer logic remains the same */ }, [showResult, onRestart]);

  // --- Handlers ---
  const handleCardClick = (clickedCard, fromArea) => {
    if (submitted) return;
    const cardId = `${clickedCard.rank}_${clickedCard.suit}`;

    // 如果点击的区域和当前选中区域不同，则清空之前的选择，开始新的选择
    if (selected.area && selected.area !== fromArea) {
      setSelected({ cards: [clickedCard], area: fromArea });
      return;
    }

    setSelected(prev => {
      const isSelected = prev.cards.some(c => `${c.rank}_${c.suit}` === cardId);
      if (isSelected) {
        const newSelectedCards = prev.cards.filter(c => `${c.rank}_${c.suit}` !== cardId);
        return {
          cards: newSelectedCards,
          area: newSelectedCards.length > 0 ? fromArea : null, // 如果没有选中的牌了，清空区域
        };
      } else {
        return {
          cards: [...prev.cards, clickedCard],
          area: fromArea,
        };
      }
    });
  };

  const moveSelectedCardsTo = (toArea) => {
    if (submitted || !selected.area || selected.cards.length === 0) return;

    const cardsToMove = selected.cards;
    const fromArea = selected.area;

    if (fromArea === toArea) {
        setSelected({ cards: [], area: null }); // 点击相同区域则取消选择
        return;
    };

    const areaMap = { head, middle, tail };
    const setAreaMap = { setHead, setMiddle, setTail };
    
    // 从源区域移除
    const cardIdsToMove = new Set(cardsToMove.map(c => `${c.rank}_${c.suit}`));
    setAreaMap[`set${fromArea.charAt(0).toUpperCase() + fromArea.slice(1)}`](
        prev => prev.filter(c => !cardIdsToMove.has(`${c.rank}_${c.suit}`))
    );

    // 添加到目标区域
    setAreaMap[`set${toArea.charAt(0).toUpperCase() + toArea.slice(1)}`](
        prev => sortHand([...prev, ...cardsToMove])
    );
    
    setSelected({ cards: [], area: null }); // 清空选择
  };
  
  // --- Drag and Drop Handlers ---
  const handleDragStart = (e, card, fromArea) => {
    const cardId = `${card.rank}_${card.suit}`;
    const isSelected = selected.cards.some(c => `${c.rank}_${c.suit}` === cardId);
    
    const cardsToDrag = isSelected ? selected.cards : [card];
    setDraggingCards(cardsToDrag);
    // 存储源区域信息
    e.dataTransfer.setData('application/json', JSON.stringify({ cards: cardsToDrag, fromArea }));
  };

  const handleDrop = (e, toArea) => {
    e.preventDefault();
    setDragOverArea(null);
    if (!draggingCards.length) return;

    const { cards, fromArea } = JSON.parse(e.dataTransfer.getData('application/json'));
    if (fromArea === toArea) return;

    const cardIdsToMove = new Set(cards.map(c => `${c.rank}_${c.suit}`));
    const areaSetters = { head: setHead, middle: setMiddle, tail: setTail };

    // 从源区域移除
    areaSetters[fromArea](prev => prev.filter(c => !cardIdsToMove.has(`${c.rank}_${c.suit}`)));
    // 添加到目标区域
    areaSetters[toArea](prev => sortHand([...prev, ...cards]));

    setDraggingCards([]);
    setSelected({ cards: [], area: null });
  };
  
  // ... 其他 handle 函数保持不变 ...
  const handleDragOver = (e, area) => { e.preventDefault(); setDragOverArea(area); };
  const handleDragLeave = () => setDragOverArea(null);
  function handleSmartSplit() { /* logic remains the same */ }
  function handleStartCompare() { /* logic remains the same */ }

  // --- Render Functions ---
  const renderCards = (cards, area, isResult = false) => { /* logic is ok but will be simplified in final return */ };
  
  // ... renderPlayerSeat and renderResultModal (no major changes needed) ...
  const renderPlayerSeat = (p) => { /* same as before */ };
  const renderResultModal = () => { /* same as before */ };

  return (
    <div className="play-container">
      <div className="game-wrapper">
        {/* Header and Players Area ... */}
        {/* ... (no changes needed here) ... */}
        <div className="game-header">
          <button className="btn-quit" onClick={onQuit}>< 退出房间</button>
          <div className="score-display">
            <span role="img" aria-label="coin" className="coin-icon">🪙</span>
            积分: {myPlayer.points || 0}
          </div>
        </div>
        <div className="players-area">
          {players.map(renderPlayerSeat)}
        </div>
        
        {/* --- Render Pai Dun --- */}
        {['head', 'middle', 'tail'].map(area => {
          const areaLabels = { head: '头道', middle: '中道', tail: '尾道' };
          const areaCards = { head, middle, tail }[area];

          return (
            <div
              key={area}
              className={`pai-dun ${dragOverArea === area ? 'drag-over' : ''}`}
              onClick={() => moveSelectedCardsTo(area)}
              onDrop={(e) => handleDrop(e, area)}
              onDragOver={(e) => handleDragOver(e, area)}
              onDragLeave={handleDragLeave}
            >
              <div className="pai-dun-label">{areaLabels[area]} ({areaCards.length})</div>
              <div className="pai-dun-content">
                {areaCards.length === 0 ? <div className="pai-dun-placeholder">点击或拖拽至此</div> :
                  areaCards.map((card) => {
                    const isSelected = selected.cards.some(c => c.rank === card.rank && c.suit === card.suit);
                    const isDragging = draggingCards.some(c => c.rank === card.rank && c.suit === card.suit);
                    return (
                      <div key={`${card.rank}_${card.suit}`} className="card-wrapper-dun">
                        <Card
                          card={card}
                          isSelected={isSelected}
                          isDragging={isDragging}
                          onClick={(e) => { e.stopPropagation(); handleCardClick(card, area); }}
                          onDragStart={(e) => { e.stopPropagation(); handleDragStart(e, card, area); }}
                        />
                      </div>
                    );
                  })
                }
              </div>
            </div>
          );
        })}
        
        {/* Actions Area */}
        <div className="actions-area">
          <button className="btn-action btn-smart-split" onClick={handleSmartSplit} disabled={submitted}>智能理牌</button>
          <button className="btn-action btn-compare" onClick={handleStartCompare} disabled={submitted}>
            {submitted ? '等待比牌' : '开始比牌'}
          </button>
        </div>
        
        <div className="message-area">{submitMsg}</div>
        
        {/* {renderResultModal()} */}
      </div>
    </div>
  );
}
