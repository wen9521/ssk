// src/App.js

import React, { useState, useEffect } from 'react';
import Lobby from './components/game/Lobby';
import Game from './components/game/Game';
import { dealCards as dealHands, isFoul as checkIsFoul } from './utils/game/cardUtils';
import { aiSmartSplit, getPlayerSmartSplits } from './utils/ai/SmartSplit';
import { calcSSSAllScores } from './utils/game/sssScore';
import { cardToLegacyFormat, dunFromLegacyFormat } from './utils/game/format';

const AI_NAMES = ['小明', '小红', '小刚'];

const initialGameState = {
  status: 'lobby', 
  players: [
    { name: AI_NAMES[0], isAI: true, hand: [], dun: null, processed: false },
    { name: AI_NAMES[1], isAI: true, hand: [], dun: null, processed: false },
    { name: AI_NAMES[2], isAI: true, hand: [], dun: null, processed: false },
  ],
  myHand: [],
  tempDuns: { head: [], middle: [], tail: [] },
  selected: { area: '', cards: [] },
  msg: '欢迎来到十三水游戏',
  scores: [0, 0, 0, 0],
  foulStates: [false, false, false, false],
  mySplits: [],
  splitIndex: 0,
  hasCompared: false,
  comparison: {
    revealedDuns: [],
    interimScores: [0, 0, 0, 0],
  },
};

export default function App() {
  const [gameState, setGameState] = useState(initialGameState);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (gameState.status !== 'comparing' || !gameState.players.find(p => p.name === '你')) return;

    const allFinalDuns = gameState.players.map(p => ({...p.dun, name: p.name}));
    
    const animationSteps = [
      { dun: 'tail', name: '尾道', delay: 1500 },
      { dun: 'middle', name: '中道', delay: 2000 },
      { dun: 'head', name: '头道', delay: 2000 },
    ];
    
    let currentDelay = 0;
    
    animationSteps.forEach((step, index) => {
      currentDelay += step.delay;
      setTimeout(() => {
        setGameState(prev => {
          const revealed = animationSteps.slice(0, index + 1).map(s => s.dun);
          const interimScores = calcSSSAllScores(allFinalDuns.map(d => ({head: d.dun1, middle: d.dun2, tail: d.dun3})), revealed);
          return {
            ...prev,
            msg: `正在比较【${step.name}】...`,
            comparison: { revealedDuns: revealed, interimScores },
          };
        });
      }, currentDelay);
    });

    setTimeout(() => {
      setGameState(prev => {
        const finalScores = calcSSSAllScores(allFinalDuns.map(d => ({head: d.dun1, middle: d.dun2, tail: d.dun3})));
        return {
          ...prev, status: 'finished', msg: '比牌完成！请查看最终结果。',
          scores: finalScores, hasCompared: true,
        }
      });
    }, currentDelay + 2000);

  }, [gameState.status, gameState.players]);

  const { status } = gameState;

  const resetToLobby = () => {
    setGameState(initialGameState);
    setIsReady(false);
  };

  const handleReady = () => {
    if (!isReady) {
      setIsReady(true);
      setGameState(prev => ({ ...initialGameState, status: 'playing', msg: '正在发牌...' }));

      const {playerHands} = dealHands(4);
      const myHand = playerHands[0];
      const aiHands = playerHands.slice(1);
      const initialDuns = { head: myHand.slice(0, 3), middle: myHand.slice(3, 8), tail: myHand.slice(8, 13) };
      
      setGameState(prev => ({
        ...prev,
        myHand: myHand,
        tempDuns: initialDuns,
        players: initialGameState.players.map((p, i) => ({ ...p, hand: aiHands[i] })),
      }));
      
      setTimeout(() => {
        const splits = getPlayerSmartSplits(myHand);
        setGameState(prev => ({ ...prev, mySplits: splits, splitIndex: 0 }));
      }, 0);

      aiHands.forEach((hand, idx) => {
        setTimeout(() => {
          setGameState(prev => {
            const newPlayers = [...prev.players];
            const split = aiSmartSplit(hand.map(cardToLegacyFormat));
            newPlayers[idx] = { ...newPlayers[idx], dun: dunFromLegacyFormat(split), processed: true };
            return { ...prev, players: newPlayers };
          });
        }, 400 + idx * 350);
      });

    } else {
      setIsReady(false);
      setGameState(initialGameState);
    }
  };
  
  const handleCardClick = (card, area) => {
    setGameState(prev => {
      if (!isReady || prev.status !== 'playing') return prev;
      const { selected } = prev;
      if (selected.area !== area) return { ...prev, selected: { area, cards: [card] } };
      const newSelectedCards = selected.cards.includes(card) ? selected.cards.filter(c => c !== card) : [...selected.cards, card];
      return { ...prev, selected: { ...selected, cards: newSelectedCards } };
    });
  };

  const moveTo = (destArea) => {
    setGameState(prev => {
      if (!isReady || prev.status !== 'playing' || !prev.selected.cards.length) return prev;
      let newDuns = JSON.parse(JSON.stringify(prev.tempDuns));
      newDuns[prev.selected.area] = newDuns[prev.selected.area].filter(c => !prev.selected.cards.includes(c));
      newDuns[destArea] = [...newDuns[destArea], ...prev.selected.cards];
      return { ...prev, tempDuns: newDuns, selected: { area: destArea, cards: [] }, msg: '' };
    });
  };

  const handleSmartSplit = () => {
    setGameState(prev => {
      if (!prev.mySplits.length) return { ...prev, msg: '智能分牌计算中…' };
      const nextIdx = (prev.splitIndex + 1) % prev.mySplits.length;
      const split = dunFromLegacyFormat(prev.mySplits[nextIdx]);
      return { ...prev, splitIndex: nextIdx, tempDuns: { head: split.dun1, middle: split.dun2, tail: split.dun3 }, msg: `智能分牌 ${nextIdx + 1}/${prev.mySplits.length}` };
    });
  };

  const handleStartCompare = () => {
    setGameState(prev => {
      if (prev.players.some(p => !p.processed)) return { ...prev, msg: '请等待所有玩家提交理牌' };
      if (prev.tempDuns.head.length !== 3 || prev.tempDuns.middle.length !== 5 || prev.tempDuns.tail.length !== 5) return { ...prev, msg: '请按 3-5-5 张分配' };
      
      const foul = checkIsFoul(prev.tempDuns.head, prev.tempDuns.middle, prev.tempDuns.tail);
      if (foul && !window.confirm("当前牌型已倒水, 确定要提交吗?")) return prev;

      const myFinalDun = {dun1: prev.tempDuns.head, dun2: prev.tempDuns.middle, dun3: prev.tempDuns.tail};
      const mePlayer = { name: '你', isAI: false, hand: prev.myHand, dun: myFinalDun, processed: true };
      
      const finalFoulStates = [foul, ...prev.players.map(p => checkIsFoul(p.dun.dun1, p.dun.dun2, p.dun.dun3))];

      return {
        ...prev,
        status: 'comparing',
        players: [mePlayer, ...prev.players], // Correctly add the player data before animation starts
        foulStates: finalFoulStates,
        msg: '所有玩家已准备就绪, 开始比牌！',
      };
    });
  };

  return (
    <div className="app-container">
      {status === 'lobby' && !isReady ? (
        <Lobby onReady={handleReady} />
      ) : (
        <Game
          gameState={gameState}
          isReady={isReady}
          onReady={handleReady}
          onCardClick={handleCardClick}
          onMoveTo={moveTo}
          onSmartSplit={handleSmartSplit}
          onStartCompare={handleStartCompare}
          onExit={resetToLobby}
        />
      )}
    </div>
  );
}
