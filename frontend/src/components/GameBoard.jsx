// src/components/GameBoard.jsx

import React, { useState, useEffect } from 'react';
import { SmartSplit } from '../game-logic/ai-logic';
import Card from './Card';
import './Play.css';

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

const toCardString = (card) => {
  const map = { A:'ace', K:'king', Q:'queen', J:'jack', T:'10' };
  const rank = map[card.rank] || card.rank.toLowerCase();
  return `${rank}_of_${card.suit}`;
};

const toCardObject = (str) => {
  const [rankStr, , suit] = str.split('_');
  const rev = { ace:'A', king:'K', queen:'Q', jack:'J', '10':'T' };
  return { rank: rev[rankStr] || rankStr, suit };
};

export default function GameBoard({
  players, myPlayerId, onCompare, onRestart, onQuit
}) {
  // Guard clauses
  if (!players || players.length === 0) {
    return (
      <div className="play-container">
        <div className="game-wrapper">
          <div>Loading Game...</div>
        </div>
      </div>
    );
  }
  const me = players.find(p => p.id === myPlayerId);
  if (!me) {
    return (
      <div className="play-container">
        <div className="game-wrapper">
          <div>Initializing player...</div>
        </div>
      </div>
    );
  }

  // State
  const [head, setHead] = useState([]);
  const [middle, setMiddle] = useState([]);
  const [tail, setTail] = useState([]);
  const [selected, setSelected] = useState({ area: null, cards: [] });
  const [dragging, setDragging] = useState([]);
  const [dragOver, setDragOver] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [msg, setMsg] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState(null);

  // Initialize or reset on new deal
  useEffect(() => {
    const all = me.cards13 || me.hand || [];
    if (all.length === 13) {
      const sorted = sortHand(all);
      setHead(sorted.slice(0,3));
      setMiddle(sorted.slice(3,8));
      setTail(sorted.slice(8,13));
    } else {
      setHead(sortHand(me.head || []));
      setMiddle(sortHand(me.middle || []));
      setTail(sortHand(me.tail || []));
    }
    setSelected({ area: null, cards: [] });
    setDragging([]);
    setSubmitted(me.submitted || false);
    setShowResult(false);
    setResultData(null);
  }, [players, myPlayerId]);

  // Show final results when available
  useEffect(() => {
    if (players.some(p => typeof p.score === 'number')) {
      setResultData(players);
      setShowResult(true);
    }
  }, [players]);

  // Auto-close result modal
  useEffect(() => {
    if (!showResult) return;
    const timer = setTimeout(() => {
      setShowResult(false);
      if (typeof onRestart === 'function') onRestart();
    }, 8000);
    return () => clearTimeout(timer);
  }, [showResult, onRestart]);

  // Select/unselect cards
  const handleCardClick = (card, area) => {
    if (submitted) return;
    const id = `${card.rank}_${card.suit}`;
    if (selected.area && selected.area !== area) {
      setSelected({ area, cards: [card] });
      return;
    }
    setSelected(prev => {
      const exists = prev.cards.find(c => `${c.rank}_${c.suit}` === id);
      if (exists) {
        const rest = prev.cards.filter(c => `${c.rank}_${c.suit}` !== id);
        return { area: rest.length ? area : null, cards: rest };
      } else {
        return { area, cards: [...prev.cards, card] };
      }
    });
  };

  // Move selected cards
  const moveSelected = (toArea) => {
    if (submitted) return;
    const { area: from, cards } = selected;
    if (!from || cards.length === 0 || from === toArea) {
      setSelected({ area: null, cards: [] });
      return;
    }
    const setters = { head: setHead, middle: setMiddle, tail: setTail };
    const removeIds = new Set(cards.map(c => `${c.rank}_${c.suit}`));
    // Remove from source
    setters[from](arr => arr.filter(c => !removeIds.has(`${c.rank}_${c.suit}`)));
    // Add to dest
    setters[toArea](arr => sortHand([...arr, ...cards]));
    setSelected({ area: null, cards: [] });
  };

  // Drag & drop
  const handleDragStart = (e, card, area) => {
    const id = `${card.rank}_${card.suit}`;
    const inSel = selected.cards.some(c => `${c.rank}_${c.suit}` === id);
    const toDrag = inSel ? selected.cards : [card];
    setDragging(toDrag);
    setSelected({ area, cards: toDrag });
    e.dataTransfer.setData('application/json', JSON.stringify({ cards: toDrag, from: area }));
  };
  const handleDrop = (e, toArea) => {
    e.preventDefault();
    setDragOver(null);
    const { cards, from } = JSON.parse(e.dataTransfer.getData('application/json'));
    setDragging([]);
    setSelected({ area: null, cards: [] });
    if (from === toArea) return;
    moveSelected(toArea);
  };
  const handleDragOver = (e, area) => { e.preventDefault(); setDragOver(area); };
  const handleDragLeave = () => setDragOver(null);

  // Smart split
  const handleSmartSplit = () => {
    if (submitted) return;
    const all = [...head, ...middle, ...tail];
    if (all.length !== 13) return;
    const deck = all.map(toCardString);
    const hands = SmartSplit(deck);
    if (!hands?.length) return;
    setHead(sortHand(hands[0].head.map(toCardObject)));
    setMiddle(sortHand(hands[0].middle.map(toCardObject)));
    setTail(sortHand(hands[0].tail.map(toCardObject)));
    setSelected({ area: null, cards: [] });
  };

  // Compare
  const handleCompare = () => {
    if (submitted) return;
    if (head.length!==3 || middle.length!==5 || tail.length!==5) {
      setMsg('请按 3-5-5 张牌分配');
      setTimeout(() => setMsg(''), 2000);
      return;
    }
    setSubmitted(true);
    onCompare?.({ head, middle, tail });
  };

  // Render one pile
  const renderPile = (arr, label, area) => (
    <div
      key={area}
      className={`pai-dun ${dragOver===area?'drag-over':''}`}
      onClick={() => moveSelected(area)}
      onDrop={e => handleDrop(e, area)}
      onDragOver={e => handleDragOver(e, area)}
      onDragLeave={handleDragLeave}
    >
      <div className="pai-dun-label">{label} ({arr.length})</div>
      <div className="pai-dun-content">
        {arr.length===0
          ? <div className="pai-dun-placeholder">拖拽至此</div>
          : arr.map(card => {
              const id = `${card.rank}_${card.suit}`;
              const isSel = selected.cards.some(c=>`${c.rank}_${c.suit}`===id);
              const isDrag = dragging.some(c=>`${c.rank}_${c.suit}`===id);
              return (
                <div key={id} className="card-wrapper-dun">
                  <Card
                    card={card}
                    isSelected={isSel}
                    isDragging={isDrag}
                    onClick={e => { e.stopPropagation(); handleCardClick(card, area); }}
                    onDragStart={e => { e.stopPropagation(); handleDragStart(e, card, area); }}
                  />
                </div>
              );
            })
        }
      </div>
    </div>
  );

  // Render results modal
  const renderModal = () => {
    if (!showResult || !resultData) return null;
    return (
      <div className="modal-overlay" onClick={onRestart}>
        <div className="modal-content" onClick={e=>e.stopPropagation()}>
          <button className="modal-close-btn" onClick={onRestart}>×</button>
          {resultData
            .sort((a,b)=>(b.score||0)-(a.score||0))
            .map(p=>(
              <div key={p.id} className="result-player">
                <div className={`result-player-header ${p.id===myPlayerId?'me':''}`}>
                  <span className="player-name">{p.name}</span>
                  {p.isFoul && <span className="foul-tag"> (倒水)</span>}
                  <span className="player-score">
                    ({(p.score||0)>0?'+':''}{p.score||0}分)
                  </span>
                </div>
                {['head','middle','tail'].map((sec,i)=>(
                  <div key={sec} className="result-hand">
                    {(p[sec]||[]).map((c,idx)=>(
                      <div
                        key={`${sec}-${idx}`}
                        className="card-wrapper-dun"
                        style={{ '--card-index': idx }}
                      >
                        <Card card={c} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))
          }
        </div>
      </div>
    );
  };

  return (
    <div className="play-container">
      <div className="game-wrapper">
        {/* Header */}
        <div className="game-header">
          <button className="btn-quit" onClick={onQuit}>
            {'< 退出房间'}
          </button>
          <div className="score-display">
            <span role="img" aria-label="coin">🪙</span>
            积分: {me.points||0}
          </div>
        </div>

        {/* Players */}
        <div className="players-area">
          {players.map(p=>(
            <div key={p.id} className={`player-seat ${p.id===myPlayerId?'player-me':''}`}>
              <div>{p.name}</div>
              <div className={`player-status ${p.submitted?'ready':''}`}>
                {p.submitted?'已准备':'等待中'}
              </div>
            </div>
          ))}
        </div>

        {/* Three piles */}
        {renderPile(head, '头道', 'head')}
        {renderPile(middle, '中道', 'middle')}
        {renderPile(tail, '尾道', 'tail')}

        {/* Actions */}
        <div className="actions-area">
          <button
            className="btn-action btn-smart-split"
            onClick={handleSmartSplit}
            disabled={submitted}
          >
            智能理牌
          </button>
          <button
            className="btn-action btn-compare"
            onClick={handleCompare}
            disabled={submitted}
          >
            {submitted?'等待比牌':'开始比牌'}
          </button>
        </div>

        {/* Message */}
        <div className="message-area">{msg}</div>

        {/* Result Modal */}
        {renderModal()}
      </div>
    </div>
  );
}
```
