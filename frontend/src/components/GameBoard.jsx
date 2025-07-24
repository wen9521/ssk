import React, { useState, useEffect } from 'react';
import { SmartSplit } from '../game-logic/ai-logic';
import Card from './Card';
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

  useEffect(() => {
    const freshPlayer = players.find(p => p.id === myPlayerId);
    if (freshPlayer) {
      const allCards = freshPlayer.cards13 || freshPlayer.hand || [];
      if (allCards.length === 13) {
        const sorted = sortHand(allCards);
        setHead(sorted.slice(0, 3));
        setMiddle(sorted.slice(3, 8));
        setTail(sorted.slice(8, 13));
      } else {
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

  useEffect(() => {
    const finalResult = players.some(p => typeof p.score === 'number');
    if (finalResult) {
      setResultModalData(players);
      setShowResult(true);
    }
  }, [players]);

  useEffect(() => {
    if (showResult) {
      const timer = setTimeout(() => {
        if (typeof onRestart === 'function') onRestart();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [showResult, onRestart]);

  const handleCardClick = (clickedCard, fromArea) => {
    if (submitted) return;
    const cardId = `${clickedCard.rank}_${clickedCard.suit}`;

    if (selected.area && selected.area !== fromArea) {
      setSelected({ cards: [clickedCard], area: fromArea });
      return;
    }

    setSelected(prev => {
      const isSelected = prev.cards.some(c => `${c.rank}_${c.suit}` === cardId);
      if (isSelected) {
        const newSelectedCards = prev.cards.filter(c => `${c.rank}_${c.suit}` !== cardId);
        return { cards: newSelectedCards, area: newSelectedCards.length > 0 ? fromArea : null };
      } else {
        return { cards: [...prev.cards, clickedCard], area: fromArea };
      }
    });
  };
  
  const moveSelectedCardsTo = (toArea) => {
    if (submitted || !selected.area || selected.cards.length === 0) return;
    
    const cardsToMove = selected.cards;
    const fromArea = selected.area;

    if (fromArea === toArea) {
      setSelected({ cards: [], area: null });
      return;
    }

    const areaState = { head, middle, tail };
    const setAreaState = { setHead, setMiddle, setTail };
    
    const cardIdsToMove = new Set(cardsToMove.map(c => `${c.rank}_${c.suit}`));

    setAreaState[`set${fromArea.charAt(0).toUpperCase() + fromArea.slice(1)}`](
      prev => prev.filter(c => !cardIdsToMove.has(`${c.rank}_${c.suit}`))
    );

    setAreaState[`set${toArea.charAt(0).toUpperCase() + toArea.slice(1)}`](
      prev => sortHand([...prev, ...cardsToMove])
    );
    
    setSelected({ cards: [], area: null });
  };
  
  const handleDragStart = (e, card, fromArea) => {
    const cardId = `${card.rank}_${card.suit}`;
    const isSelected = selected.cards.some(c => `${c.rank}_${c.suit}` === cardId);
    const cardsToDrag = isSelected ? selected.cards : [card];
    setDraggingCards(cardsToDrag);
    e.dataTransfer.setData('application/json', JSON.stringify({ cards: cardsToDrag, fromArea }));
  };

  const handleDrop = (e, toArea) => {
    e.preventDefault();
    setDragOverArea(null);
    if (!draggingCards.length) return;
    
    const { cards: droppedCards, fromArea } = JSON.parse(e.dataTransfer.getData('application/json'));
    if (fromArea === toArea) {
        setDraggingCards([]);
        return;
    };

    const cardIdsToMove = new Set(droppedCards.map(c => `${c.rank}_${c.suit}`));
    const areaSetters = { head: setHead, middle: setMiddle, tail: setTail };

    areaSetters[fromArea](prev => prev.filter(c => !cardIdsToMove.has(`${c.rank}_${c.suit}`)));
    areaSetters[toArea](prev => sortHand([...prev, ...droppedCards]));

    setDraggingCards([]);
    setSelected({ cards: [], area: null });
  };
  
  const handleDragOver = (e, area) => { e.preventDefault(); setDragOverArea(area); };
  const handleDragLeave = () => setDragOverArea(null);
  
  function handleSmartSplit() {
    if (submitted) return;
    const allCards = [...head, ...middle, ...tail];
    if (allCards.length !== 13) return;

    const cardStrings = allCards.map(toCardString);
    const hands = SmartSplit(cardStrings);
    if (hands && hands.length > 0) {
      const bestHand = hands[0];
      setHead(sortHand(bestHand.head.map(toCardObject)));
      setMiddle(sortHand(bestHand.middle.map(toCardObject)));
      setTail(sortHand(bestHand.tail.map(toCardObject)));
      setSelected({ cards: [], area: null });
    }
  }

  function handleStartCompare() {
    if (submitted) return;
    if (head.length !== 3 || middle.length !== 5 || tail.length !== 5) {
      setSubmitMsg('请按 3-5-5 张牌分配');
      setTimeout(() => setSubmitMsg(''), 2000);
      return;
    }
    setSubmitted(true);
    if (typeof onCompare === 'function') {
      onCompare({ head, middle, tail });
    }
  }

  return (
    <div className="play-container">
      <div className="game-wrapper">
        <div className="game-header">
          {/* *** 修复点: 使用HTML实体 *** */}
          <button className="btn-quit" onClick={onQuit}>< 退出房间</button>
          <div className="score-display">
            <span role="img" aria-label="coin" className="coin-icon">🪙</span>
            积分: {myPlayer.points || 0}
          </div>
        </div>
        <div className="players-area">
          {players.map(p => (
            <div key={p.id} className={`player-seat ${p.id === myPlayerId ? 'player-me' : ''}`}>
              <div>{p.name}</div>
              <div className={`player-status ${p.submitted ? 'ready' : ''}`}>
                {p.submitted ? '已准备' : '等待中'}
              </div>
            </div>
          ))}
        </div>
        
        {[{area: 'head', cards: head, label: '头道'}, {area: 'middle', cards: middle, label: '中道'}, {area: 'tail', cards: tail, label: '尾道'}].map(({ area, cards, label }) => (
          <div
            key={area}
            className={`pai-dun ${dragOverArea === area ? 'drag-over' : ''}`}
            onClick={() => moveSelectedCardsTo(area)}
            onDrop={(e) => handleDrop(e, area)}
            onDragOver={(e) => handleDragOver(e, area)}
            onDragLeave={handleDragLeave}
          >
            <div className="pai-dun-label">{label} ({cards.length})</div>
            <div className="pai-dun-content">
              {cards.length === 0 ? <div className="pai-dun-placeholder">点击或拖拽至此</div> :
                cards.map((card) => {
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
        ))}
        
        <div className="actions-area">
          <button className="btn-action btn-smart-split" onClick={handleSmartSplit} disabled={submitted}>智能理牌</button>
          <button className="btn-action btn-compare" onClick={handleStartCompare} disabled={submitted}>
            {submitted ? '等待比牌' : '开始比牌'}
          </button>
        </div>
        
        <div className="message-area">{submitMsg}</div>
        
        {showResult && resultModalData && (
          <div className="modal-overlay" onClick={onRestart}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close-btn" onClick={onRestart}>×</button>
              {resultModalData.sort((a, b) => (b.score || 0) - (a.score || 0)).map(p => (
                <div key={p.id} className="result-player">
                  <div className={`result-player-header ${p.id === myPlayerId ? 'me' : ''}`}>
                    <span className="player-name">{p.name}</span>
                    {p.isFoul && <span className="foul-tag"> (倒水)</span>}
                    <span className="player-score"> ({(p.score || 0) > 0 ? '+' : ''}{p.score || 0}分)</span>
                  </div>
                  <div className="result-hand">
                    {(p.head || []).map((card, index) => 
                      <div key={`res-head-${index}`} className="card-wrapper-dun" style={{'--card-index': index}}><Card card={card} /></div>
                    )}
                  </div>
                  <div className="result-hand">
                    {(p.middle || []).map((card, index) => 
                      <div key={`res-mid-${index}`} className="card-wrapper-dun" style={{'--card-index': index}}><Card card={card} /></div>
                    )}
                  </div>
                  <div className="result-hand">
                    {(p.tail || []).map((card, index) => 
                      <div key={`res-tail-${index}`} className="card-wrapper-dun" style={{'--card-index': index}}><Card card={card} /></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
