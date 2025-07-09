// frontend/src/App.js

import React, { useState } from 'react';
import usePollingGameState from './hooks/usePollingGameState';
import PokerTable from './components/game/PokerTable';
// ✅ createDeck 和 shuffleDeck 现在不是必须的，但我们保留它以防万一
import { createDeck, shuffleDeck, dealCards } from './utils/game/cardUtils.js'; 
import { aiSmartSplit } from './utils/ai/SmartSplit.js';
import { calcSSSAllScores } from './utils/game/sssScore.js';

const BACKEND_DOMAIN = "https://9525.ip-ddns.com";

export default function App() {
  const [roomId, setRoomId] = useState('');
  const [playerIdx, setPlayerIdx] = useState(null);
  const [view, setView] = useState('lobby'); // 'lobby' 或 'game'
  const [isTryPlay, setIsTryPlay] = useState(false);
  const [msg, setMsg] = useState('欢迎来到十三水游戏');
  
  // 用于防止在动画期间重复点击
  const [isDealing, setIsDealing] = useState(false); 

  const [localGameState, setLocalGameState] = useState(null);
  const onlineGameState = usePollingGameState(roomId, isTryPlay ? null : 1500);
  const gameState = isTryPlay ? localGameState : onlineGameState;

  const resetToLobby = () => {
    setRoomId('');
    setPlayerIdx(null);
    setView('lobby');
    setIsTryPlay(false);
    setLocalGameState(null);
    setIsDealing(false); // 重置发牌状态
    setMsg('欢迎来到十三水游戏');
  };

  const createRoom = async () => { /* ... 此处代码未修改 ... */ };
  const joinRoom = async () => { /* ... 此处代码未修改 ... */ };

  /**
   * ✅ 开始试玩 (离线模式) - 已修改为带动画的发牌逻辑
   */
  const startTryPlay = () => {
    if (isDealing) return; // 如果正在发牌，则阻止重复执行
    
    setIsDealing(true); // 标记发牌动画开始
    setMsg('开始发牌...');
    setIsTryPlay(true);
    setPlayerIdx('0');

    // 1. 初始化一个空的游戏状态，用于渲染动画的起点
    const initialPlayers = Array(4).fill(null).map(() => ({ hand: [], dun: null }));
    setLocalGameState({ players: initialPlayers, status: 'dealing', scores: [0,0,0,0] });
    setView('game');

    // 2. 调用洗牌和发牌模块，获取洗好的整副牌
    const { fullDeck } = dealCards(4);

    // 3. 使用 setInterval 实现逐张发牌的动画效果
    let cardIndex = 0;
    const dealInterval = setInterval(() => {
      // 3.1 逐张将牌添加到玩家手牌中
      setLocalGameState(prevState => {
        if (!prevState) return null; // 防止在重置时出错
        const newPlayers = [...prevState.players];
        const playerToReceive = cardIndex % 4; // 轮流给玩家发牌
        const card = fullDeck[cardIndex];
        
        if (newPlayers[playerToReceive] && newPlayers[playerToReceive].hand.length < 13) {
            newPlayers[playerToReceive].hand.push(card);
        }
        
        return { ...prevState, players: newPlayers };
      });
      
      cardIndex++;

      // 3.2 当52张牌全发完后
      if (cardIndex >= 52) {
        clearInterval(dealInterval); // 停止发牌动画
        
        // 4. 发牌结束后，让AI进行智能理牌
        setTimeout(() => { // 使用微小的延迟确保UI更新
            setMsg('AI正在理牌...');
            setLocalGameState(currentState => {
              const playersWithAIAnalysis = currentState.players.map((player, index) => {
                if (index === 0) { // 人类玩家
                  return player;
                } else { // AI玩家
                  const splitResult = aiSmartSplit(player.hand);
                  return { 
                    ...player, 
                    dun: { dun1: splitResult.head, dun2: splitResult.middle, dun3: splitResult.tail }
                  };
                }
              });

              // 5. 更新状态，通知玩家可以理牌了
              setMsg('发牌完成，请您理牌。');
              setIsDealing(false); // 标记发牌动画结束
              return { ...currentState, players: playersWithAIAnalysis, status: 'playing' };
            });
        }, 200);
      }
    }, 80); // 每张牌的发牌间隔时间 (毫秒)
  };

  const startGame = async () => { /* ... 此处代码未修改 ... */ };
  const submitDun = async (duns) => { /* ... 此处代码未修改，逻辑完全兼容 ... */ 
      setMsg("理牌已提交，等待其他玩家...");
    if (isTryPlay) {
        const updatedPlayers = [...localGameState.players];
        updatedPlayers[playerIdx].dun = duns;

        const allPlayersReady = updatedPlayers.every(p => p.dun !== null);
        if (allPlayersReady) {
            const playerHandsForScoring = updatedPlayers.map(p => ({
              head: p.dun.dun1,
              middle: p.dun.dun2,
              tail: p.dun.dun3
            }));
            const scores = calcSSSAllScores(playerHandsForScoring);
            setLocalGameState({ players: updatedPlayers, status: 'finished', scores });
            setMsg("比牌完成！");
        } else {
            setLocalGameState({ ...localGameState, players: updatedPlayers });
        }

    } else {
      await fetch(`${BACKEND_DOMAIN}/api/set-dun.php`, {
        method: "POST",
        headers: {'Content-Type':'application/x-www-form-urlencoded'},
        body: `room_id=${roomId}&player_idx=${playerIdx}&dun=${encodeURIComponent(JSON.stringify(duns))}`
      });
    }
  };

  const resetGame = async () => { /* ... 此处代码未修改 ... */ };
  
  const renderLobby = () => (
    <div style={{ padding: 20, maxWidth: '400px', margin: 'auto', textAlign: 'center' }}>
      <h1>十三水</h1>
      <div style={{ color: "red", minHeight: '20px', marginBottom: '10px' }}>{msg}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* 在发牌动画期间禁用按钮 */}
        <button onClick={startTryPlay} disabled={isDealing}>单机试玩 (vs 3 AI)</button>
        <hr/>
        <button onClick={createRoom} disabled={isDealing}>创建多人房间</button>
        <div>
          <input placeholder="输入房间号加入" value={roomId} onChange={e => setRoomId(e.target.value)} style={{ marginRight: '8px' }} />
          <button onClick={joinRoom} disabled={isDealing}>加入房间</button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <button onClick={resetToLobby} style={{ position: 'absolute', top: 10, left: 10 }}>返回大厅</button>
      {view === 'lobby' || !gameState ? renderLobby() : (
        <PokerTable
          isTryPlay={isTryPlay}
          gameState={gameState}
          playerIdx={playerIdx}
          onSubmitDun={submitDun}
          onStartGame={startGame}
          // 单机模式“再来一局”也播放发牌动画
          onResetGame={isTryPlay ? startTryPlay : resetGame}
          msg={msg}
        />
      )}
    </div>
  );
}
