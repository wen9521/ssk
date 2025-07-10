// src/App.js

import React, { useState, useEffect } from 'react';
import Lobby from './components/game/Lobby';
import PokerTable from './components/game/PokerTable';
import usePollingGameState from './hooks/usePollingGameState';
import { dealCards, isFoul as checkIsFoul } from './utils/game/cardUtils';
import { aiSmartSplit } from './utils/ai/SmartSplit';
import { calcSSSAllScores } from './utils/game/sssScore';
import './styles/App.css';

const BACKEND_DOMAIN = "https://9525.ip-ddns.com";
const AI_NAMES = ['AI·关羽', 'AI·张飞', 'AI·赵云'];

// --- 数据格式转换工具 ---
const cardToLegacyFormat = (card) => {
    const rankStr = card.slice(0, -1);
    const suitChar = card.slice(-1);
    const rankMap = { 'A': 'ace', 'K': 'king', 'Q': 'queen', 'J': 'jack', '10': '10', '9': '9', '8': '8', '7': '7', '6': '6', '5': '5', '4': '4', '3': '3', '2': '2' };
    const suitMap = { '♠': 'spades', '♥': 'hearts', '♦': 'diamonds', '♣': 'clubs' };
    if (!rankMap[rankStr] || !suitMap[suitChar]) return '2_of_clubs';
    return `${rankMap[rankStr]}_of_${suitMap[suitChar]}`;
};

const dunFromLegacyFormat = (dun) => {
    const rankMap = { 'ace': 'A', 'king': 'K', 'queen': 'Q', 'jack': 'J', '10': '10', '9': '9', '8': '8', '7': '7', '6': '6', '5': '5', '4': '4', '3': '3', '2': '2' };
    const suitMap = { 'spades': '♠', 'hearts': '♥', 'diamonds': '♦', 'clubs': '♣' };
    const convertCard = (card) => {
        const parts = card.split('_of_');
        const rank = rankMap[parts[0]];
        const suit = suitMap[parts[1]];
        return rank && suit ? rank + suit : '2♣';
    };
    if (!dun || !dun.head || !dun.middle || !dun.tail) return { dun1: [], dun2: [], dun3: [] };
    return {
        dun1: dun.head.map(convertCard),
        dun2: dun.middle.map(convertCard),
        dun3: dun.tail.map(convertCard),
    };
};

// --- 初始状态定义 ---
const initialGameState = {
  status: 'lobby', // 'lobby', 'dealing', 'playing', 'comparing', 'finished'
  players: [],
  scores: [],
  fullDeck: [],
  selectedCards: [], 
  tempDuns: { dun1: [], dun2: [], dun3: [] },
  isFoul: false,
  // [新增] 比牌动画状态
  comparisonState: {
    revealedDuns: [], // e.g., ['dun3', 'dun2', 'dun1']
    interimScores: [], // 存放比牌过程中的临时分数
  },
};

export default function App() {
  const [roomId, setRoomId] = useState('');
  const [playerIdx, setPlayerIdx] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [msg, setMsg] = useState('欢迎来到十三水游戏');
  const [isActionDisabled, setIsActionDisabled] = useState(false);
  const [gameState, setGameState] = useState(initialGameState);
  const onlineGameState = usePollingGameState(roomId, isOnline ? 1500 : null);

  // --- 效果钩子 ---

  useEffect(() => {
    if (isOnline && onlineGameState) {
      setGameState(onlineGameState);
    }
  }, [onlineGameState, isOnline]);

  // [新增] 处理比牌动画的 useEffect
  useEffect(() => {
    if (gameState.status !== 'comparing') return;

    const playerDunsForScoring = gameState.players.map(p =>
        p.dun ? { head: p.dun.dun1, middle: p.dun.dun2, tail: p.dun.dun3 } : null
    );

    const animationSteps = [
        { dun: 'dun3', name: '尾道', delay: 1500 },
        { dun: 'dun2', name: '中道', delay: 2000 },
        { dun: 'dun1', name: '头道', delay: 2000 },
    ];

    let currentDelay = 0;

    animationSteps.forEach((step, index) => {
        currentDelay += step.delay;
        setTimeout(() => {
            setGameState(prev => {
                const revealed = animationSteps.slice(0, index + 1).map(s => s.dun);
                // 假设 calcSSSAllScores 可以根据 revealedDuns 计算部分得分
                const currentScores = calcSSSAllScores(playerDunsForScoring, revealed);

                return {
                    ...prev,
                    msg: `正在比较【${step.name}】...`,
                    comparisonState: {
                        revealedDuns: revealed,
                        interimScores: currentScores,
                    }
                };
            });
        }, currentDelay);
    });

    // 动画结束后，计算最终结果并结束游戏
    setTimeout(() => {
        setGameState(prev => {
            const finalScores = calcSSSAllScores(playerDunsForScoring);
            return {
                ...prev,
                status: 'finished',
                msg: '比牌完成！请查看最终结果。',
                scores: finalScores,
            }
        });
    }, currentDelay + 2000);

  }, [gameState.status]); // 仅在 status 变化时触发

  // --- 核心游戏逻辑函数 ---

  const resetToLobby = () => {
    setGameState(initialGameState);
    setRoomId('');
    setPlayerIdx(null);
    setIsOnline(false);
    setMsg('欢迎来到十三水游戏');
    setIsActionDisabled(false);
  };

  const startTryPlay = () => {
    // ... (此函数无变化)
    setIsActionDisabled(true);
    setMsg('正在洗牌和发牌...');
    const { fullDeck, playerHands } = dealCards(4);
    const players = Array(4).fill(null).map((_, i) => ({
      name: i === 0 ? '你' : AI_NAMES[i - 1],
      hand: [],
      dun: null,
    }));
    setGameState({ ...initialGameState, status: 'dealing', players, fullDeck });
    setPlayerIdx(0);
    setIsOnline(false);

    let cardIndex = 0;
    const dealInterval = setInterval(() => {
      setGameState(prev => {
        const newPlayers = [...prev.players];
        newPlayers[cardIndex % 4].hand.push(fullDeck[cardIndex]);
        return { ...prev, players: newPlayers };
      });
      cardIndex++;
      if (cardIndex >= 52) {
        clearInterval(dealInterval);
        setTimeout(() => {
          setMsg('AI 正在理牌...');
          setGameState(prev => {
            const playersAfterAI = prev.players.map((p, i) => {
              const finalHand = playerHands[i];
              if (i === 0) return { ...p, hand: finalHand };
              const legacyHand = finalHand.map(cardToLegacyFormat);
              const splitResult = dunFromLegacyFormat(aiSmartSplit(legacyHand));
              return { ...p, hand: finalHand, dun: splitResult };
            });
            return { ...prev, players: playersAfterAI, status: 'playing' };
          });
          setMsg('发牌完成，请您理牌。');
          setIsActionDisabled(false);
        }, 500);
      }
    }, 60);
  };
  
  // [修改] 提交理牌后进入 'comparing' 状态
  const handleSubmitDun = () => {
      const { tempDuns, isFoul } = gameState;
      if (tempDuns.dun1.length !== 3 || tempDuns.dun2.length !== 5 || tempDuns.dun3.length !== 5) {
          setMsg("请按头道3张、中道5张、尾道5张分配好再提交！");
          return;
      }
      if (isFoul && !window.confirm("当前牌型已倒水，确定要提交吗？")) return;
      
      setMsg("理牌已提交，等待其他玩家...");
      setGameState(prev => {
          const updatedPlayers = [...prev.players];
          if (updatedPlayers[playerIdx]) {
            updatedPlayers[playerIdx].dun = prev.tempDuns;
          }

          const allPlayersReady = updatedPlayers.every(p => p && p.dun);
          
          if (allPlayersReady) {
              setMsg("所有玩家已准备就绪，开始比牌！");
              return { 
                ...prev, 
                players: updatedPlayers, 
                status: 'comparing', // 进入比牌状态
                selectedCards: [],
                comparisonState: { revealedDuns: [], interimScores: Array(prev.players.length).fill(0) } // 初始化动画状态
              };
          }
          
          return { ...prev, players: updatedPlayers, selectedCards: [] };
      });
  };

  const handleSelectCard = (card) => {
    // ... (此函数无变化)
    setGameState(prev => {
        if (prev.status !== 'playing') return prev;
        const selected = prev.selectedCards || [];
        const isSelected = selected.includes(card);
        const newSelectedCards = isSelected ? selected.filter(c => c !== card) : [...selected, card];
        return { ...prev, selectedCards: newSelectedCards };
    });
  };

  const handleMoveToDun = (dunName) => {
    // ... (此函数无变化)
    setGameState(prev => {
        if (prev.status !== 'playing' || !prev.selectedCards || prev.selectedCards.length === 0) return prev;
        const tempDuns = { ...prev.tempDuns };
        Object.keys(tempDuns).forEach(key => { tempDuns[key] = tempDuns[key].filter(c => !prev.selectedCards.includes(c)); });
        tempDuns[dunName] = [...tempDuns[dunName], ...prev.selectedCards];
        if (tempDuns[dunName].length > { dun1: 3, dun2: 5, dun3: 5 }[dunName]) return prev;
        const foul = checkIsFoul(tempDuns.dun1, tempDuns.dun2, tempDuns.dun3);
        setMsg(foul ? "警告：当前牌型已倒水！" : "理牌中...");
        return { ...prev, tempDuns, selectedCards: [], isFoul: foul };
    });
  };
  
  const handleSmartSplit = () => {
    // ... (此函数无变化)
    const myFullHand = [...gameState.players[playerIdx].hand]; 
    const legacyHand = myFullHand.map(cardToLegacyFormat);
    const duns = dunFromLegacyFormat(aiSmartSplit(legacyHand));
    setGameState(prev => ({ ...prev, tempDuns: duns, isFoul: checkIsFoul(duns.dun1, duns.dun2, duns.dun3) }));
    setMsg("已为您智能理牌，可直接提交或微调。");
  };

  const handleResetGame = () => {
    startTryPlay();
  };

  // --- 渲染 ---

  return (
    <div className="app-container">
      {gameState.status === 'lobby' ? (
        <Lobby msg={msg} roomId={roomId} isActionDisabled={isActionDisabled} onSetRoomId={setRoomId} onStartTryPlay={startTryPlay} />
      ) : (
        <PokerTable
          gameState={gameState}
          playerIdx={playerIdx}
          msg={msg}
          onResetGame={handleResetGame}
          onSubmitDun={handleSubmitDun}
          onSmartSplit={handleSmartSplit}
          onSelectCard={handleSelectCard}
          onMoveToDun={handleMoveToDun}
          onExit={resetToLobby}
        />
      )}
    </div>
  );
}
