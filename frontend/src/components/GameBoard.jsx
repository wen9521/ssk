// src/components/GameBoard.jsx

import React, { useState, useEffect } from 'react';
import { SmartSplit } from '../game-logic/ai-logic';
import Card from './Card';
import Hand from './Hand';
import './Play.css';

// 定义牌的点数和花色顺序，用于排序
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
  return rank + '_of_' + card.suit;
};

const toCardObject = (str) => {
  const parts = str.split('_of_');
  const rev = { ace:'A', king:'K', queen:'Q', jack:'J', '10':'T' };
  const rank = rev[parts[0]] || parts[0].toUpperCase();
  return { rank, suit: parts[1] };
};

export default function GameBoard({ players, myPlayerId, onCompare, onRestart, onQuit }) {
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

  // 初始状态分配
  const getInitialState = (player) => {
    const cards = player.cards13 || player.hand || [];
    const head = player.head || [];
    const middle = player.middle || [];
    const tail = player.tail || [];
    const myCards = head.length||middle.length||tail.length ? [] : cards;
    return {
      myCards: sortHand(myCards),
      head: sortHand(head),
      middle: sortHand(middle),
      tail: sortHand(tail),
      submitted: player.submitted || false
    };
  };

  const init = getInitialState(me);

  // State
  const [myCards, setMyCards] = useState(init.myCards);
  const [head, setHead] = useState(init.head);
  const [middle, setMiddle] = useState(init.middle);
  const [tail, setTail] = useState(init.tail);
  const [selected, setSelected] = useState({ area:'', cards:[] });
  const [submitMsg, setSubmitMsg] = useState('');
  const [submitted, setSubmitted] = useState(init.submitted);
  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState(null);

  // 新牌局或刷新时重置
  useEffect(() => {
    const p = players.find(p => p.id === myPlayerId);
    if (!p) return;
    const s = getInitialState(p);
    setMyCards(s.myCards);
    setHead(s.head);
    setMiddle(s.middle);
    setTail(s.tail);
    setSelected({ area:'', cards:[] });
    setSubmitMsg('');
    setSubmitted(s.submitted);
    setShowResult(false);
    setResultData(null);
  }, [players, myPlayerId]);

  // 当所有玩家都有 score 时显示结果
  useEffect(() => {
    if (players.some(p => typeof p.score === 'number')) {
      setResultData(players);
      setShowResult(true);
    }
  }, [players]);

  // 结果弹窗自动关闭并 restart
  useEffect(() => {
    if (!showResult) return;
    const t = setTimeout(() => {
      setShowResult(false);
      typeof onRestart === 'function' && onRestart();
    }, 8000);
    return () => clearTimeout(t);
  }, [showResult, onRestart]);

  // 智能分牌
  const handleSmartSplit = () => {
    if (myCards.length !== 13) return;
    const deck = myCards.map(toCardString);
    const hands = SmartSplit(deck);
    if (hands && hands.length) {
      const best = hands[0];
      setHead(sortHand(best.head.map(toCardObject)));
      setMiddle(sortHand(best.middle.map(toCardObject)));
      setTail(sortHand(best.tail.map(toCardObject)));
      setMyCards([]);
    }
  };

  // 点击选卡
  const handleCardClick = (card, area) => {
    if (submitted) return;
    if (selected.area !== area) {
      setSelected({ area, cards:[card] });
    } else {
      const exists = selected.cards.find(c => c.rank===card.rank && c.suit===card.suit);
      if (exists) {
        setSelected({
          area,
          cards: selected.cards.filter(c => !(c.rank===card.rank && c.suit===card.suit))
        });
      } else {
        setSelected({
          area,
          cards: [...selected.cards, card]
        });
      }
    }
  };

  // 卡牌移动
  const moveTo = (dest) => {
    if (submitted || !selected.cards.length) return;
    const src = selected.area;
    const cardSet = new Set(selected.cards.map(c => c.rank+'_'+c.suit));

    const areas = { hand: myCards, head, middle, tail };
    // 从源区域移除
    areas[src] = areas[src].filter(c => !cardSet.has(c.rank+'_'+c.suit));
    // 添加到目标
    areas[dest] = [...areas[dest], ...selected.cards];

    setMyCards(sortHand(areas.hand));
    setHead(sortHand(areas.head));
    setMiddle(sortHand(areas.middle));
    setTail(sortHand(areas.tail));
    setSelected({ area:dest, cards:[] });
    setSubmitMsg('');
  };

  // 开始比牌
  const handleCompare = () => {
    if (submitted) return;
    if (head.length!==3 || middle.length!==5 || tail.length!==5) {
      setSubmitMsg('请按 3-5-5 张牌分配');
      return;
    }
    setSubmitted(true);
    typeof onCompare === 'function' && onCompare({ head, middle, tail });
  };

  // 渲染座位
  const renderSeat = (p) => (
    <div key={p.id} className={`player-seat ${p.id===myPlayerId?'player-me':''}`}>
      <div>{p.name}</div>
      <div className={`player-status ${p.submitted?'ready':''}`}>
        {p.submitted ? '已准备' : '等待中'}
      </div>
    </div>
  );

  // 渲染牌堆
  const renderPile = (arr, label, area) => (
    <div className="pai-dun" onClick={() => moveTo(area)}>
      <div className="pai-dun-content">
        {arr.length === 0
          ? <div className="pai-dun-placeholder">请放置</div>
          : arr.map((card, i) => {
              const isSel = selected.area===area &&
                            selected.cards.some(c=>c.rank===card.rank && c.suit===card.suit);
              return (
                <div key={card.rank+'_'+card.suit+'_'+area+'_'+i}
                     className="card-wrapper-dun"
                     style={{ '--card-index': i, zIndex:i }}>
                  <Card
                    rank={card.rank}
                    suit={card.suit}
                    isSelected={isSel}
                    onClick={() => handleCardClick(card, area)}
                  />
                </div>
              );
            })
        }
      </div>
      <div className="pai-dun-label">{label} ({arr.length})</div>
    </div>
  );

  // 渲染结果弹窗
  const renderModal = () => {
    if (!showResult || !resultData) return null;
    return (
      <div className="modal-overlay" onClick={() => onRestart && onRestart()}>
        <div className="modal-content" onClick={e=>e.stopPropagation()}>
          <button className="modal-close-btn" onClick={() => onRestart && onRestart()}>×</button>
          {resultData.map(p => (
            <div key={p.id} className="result-player">
              <div className={`result-player-header ${p.id===myPlayerId?'me':''}`}>
                <span className="player-name">{p.name}</span>
                {p.isFoul && <span className="foul-tag"> (倒水)</span>}
                <span className="player-score"> ({p.score||0}分)</span>
              </div>
              <div className="result-hand">
                {renderPile(p.head||[], '', 'result')}
              </div>
              <div className="result-hand">
                {renderPile(p.middle||[], '', 'result')}
              </div>
              <div className="result-hand">
                {renderPile(p.tail||[], '', 'result')}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="play-container">
      <div className="game-wrapper">
        <div className="game-header">
          <button className="btn-quit" onClick={onQuit}>
            {'< 退出房间'}
          </button>
          <div className="score-display">
            <span role="img" aria-label="coin" className="coin-icon">🪙</span>
            积分: {me.points || 0}
          </div>
        </div>

        <div className="players-area">
          {players.map(renderSeat)}
        </div>

        {renderPile(head, '头道', 'head')}
        {renderPile(middle, '中道', 'middle')}
        {renderPile(tail, '尾道', 'tail')}

        <div className="actions-area">
          <button
            className="btn-action btn-smart-split"
            onClick={handleSmartSplit}
            disabled={submitted || myCards.length!==13}
          >
            智能分牌
          </button>
          <button
            className="btn-action btn-compare"
            onClick={handleCompare}
            disabled={submitted}
          >
            {submitted ? '等待比牌' : '开始比牌'}
          </button>
        </div>

        <div className="message-area">{submitMsg}</div>
        {renderModal()}
      </div>
    </div>
  );
}
