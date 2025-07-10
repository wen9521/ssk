import React, { useState, useEffect } from 'react';
import Lobby from './components/game/Lobby';
import PokerTable from './components/game/PokerTable';
import usePollingGameState from './hooks/usePollingGameState';
import { dealCards } from './utils/game/cardUtils';
import { aiSmartSplit } from './utils/ai/SmartSplit'; // 假设已适配
import { calcSSSAllScores } from './utils/game/sssScore'; // 假设已适配
import './styles/App.css';

const BACKEND_DOMAIN = "https://9525.ip-ddns.com";
const AI_NAMES = ['AI·关羽', 'AI·张飞', 'AI·赵云'];

const initialGameState = {
  status: 'lobby', // 'lobby', 'dealing', 'playing', 'finished'
  players: [],     // { name: string, hand: string[], dun: {dun1, dun2, dun3} | null }
  scores: [],
  fullDeck: [],    // 用于发牌动画
};

export default function App() {
  const [roomId, setRoomId] = useState('');
  const [playerIdx, setPlayerIdx] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [msg, setMsg] = useState('欢迎来到十三水游戏');
  const [isActionDisabled, setIsActionDisabled] = useState(false); // 防止重复点击

  // [重构] 统一的游戏状态
  const [gameState, setGameState] = useState(initialGameState);

  // 在线模式轮询
  const onlineGameState = usePollingGameState(roomId, isOnline ? 1500 : null);

  // [重构] 当从服务器获取到新状态时，更新本地状态
  useEffect(() => {
    if (isOnline && onlineGameState) {
      setGameState(onlineGameState);
    }
  }, [onlineGameState, isOnline]);

  const resetToLobby = () => {
    setRoomId('');
    setPlayerIdx(null);
    setIsOnline(false);
    setGameState(initialGameState);
    setMsg('欢迎来到十三水游戏');
    setIsActionDisabled(false);
  };
  
  // [重构] 核心游戏逻辑：开始单机试玩
  const startTryPlay = () => {
    setIsActionDisabled(true);
    setMsg('正在洗牌和发牌...');
    
    const numPlayers = 4;
    const { fullDeck, playerHands } = dealCards(numPlayers);

    // 1. 初始化玩家数据结构
    const players = Array(numPlayers).fill(null).map((_, i) => ({
      name: i === 0 ? '你' : AI_NAMES[i - 1],
      hand: [], // 动画开始时手牌为空
      dun: null,
    }));
    
    // 2. 设置初始状态，准备开始动画
    setGameState({
      status: 'dealing',
      players,
      scores: [0,0,0,0],
      fullDeck
    });
    setPlayerIdx(0);
    setIsOnline(false);

    // 3. 发牌动画
    let cardIndex = 0;
    const dealInterval = setInterval(() => {
      setGameState(prev => {
        const newPlayers = [...prev.players];
        const playerToReceive = cardIndex % numPlayers;
        newPlayers[playerToReceive].hand.push(fullDeck[cardIndex]);
        return { ...prev, players: newPlayers };
      });
      cardIndex++;

      if (cardIndex >= 52) {
        clearInterval(dealInterval);
        
        // 4. 发牌结束，AI 自动理牌
        setTimeout(() => {
          setMsg('AI 正在理牌...');
          setGameState(prev => {
            const playersAfterAI = prev.players.map((p, i) => {
              if (i === 0) { // 人类玩家
                return { ...p, hand: playerHands[i] }; // 确保手牌是最终的13张
              }
              // AI 玩家
              const splitResult = aiSmartSplit(playerHands[i]);
              return {
                ...p,
                name: p.name,
                hand: playerHands[i],
                dun: { dun1: splitResult.head, dun2: splitResult.middle, dun3: splitResult.tail }
              };
            });
            return { ...prev, players: playersAfterAI, status: 'playing' };
          });
          setMsg('发牌完成，请您理牌。');
          setIsActionDisabled(false);
        }, 500);
      }
    }, 60);
  };

  // [重构] 玩家提交理牌结果 (单机模式)
  const handleSubmitDun = (duns) => {
      setMsg("理牌已提交，等待比牌...");
      
      // 更新玩家的牌墩
      const updatedPlayers = [...gameState.players];
      updatedPlayers[playerIdx].dun = duns;

      // 检查是否所有人都准备好了
      const allPlayersReady = updatedPlayers.every(p => p.dun !== null);
      if (allPlayersReady) {
          const playerDunsForScoring = updatedPlayers.map(p => ({
            head: p.dun.dun1,
            middle: p.dun.dun2,
            tail: p.dun.dun3
          }));
          const scores = calcSSSAllScores(playerDunsForScoring);
          setGameState({ ...gameState, players: updatedPlayers, status: 'finished', scores });
          setMsg("比牌完成！");
      } else {
          setGameState({ ...gameState, players: updatedPlayers });
      }
  };
  
  // [重构] 再来一局 (对于单机模式，就是重新调用 startTryPlay)
  const handleResetGame = () => {
    if (isOnline) {
      // 在线模式重置逻辑...
    } else {
      startTryPlay();
    }
  };

  // 其他在线模式的函数 (createRoom, joinRoom) 保持不变，但它们会设置 isOnline = true
  // ...

  return (
    <div className="app-container">
      {gameState.status === 'lobby' ? (
        <Lobby
          msg={msg}
          roomId={roomId}
          isActionDisabled={isActionDisabled}
          onSetRoomId={setRoomId}
          onStartTryPlay={startTryPlay}
          // onCreateRoom={...}
          // onJoinRoom={...}
        />
      ) : (
        <PokerTable
          gameState={gameState}
          playerIdx={playerIdx}
          msg={msg}
          onResetGame={handleResetGame}
          onSubmitDun={handleSubmitDun} // 传递回调
          // onSmartSplit={...}
          onExit={resetToLobby}
        />
      )}
    </div>
  );
}