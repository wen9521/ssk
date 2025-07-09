// frontend/src/App.js (已修正 sssScore.js 和 SmartSplit.js 的导入路径)

import React, { useState, useEffect } from 'react';
import usePollingGameState from './hooks/usePollingGameState';
import PokerTable from './components/game/PokerTable';
import { createDeck, shuffleDeck } from './utils/cardUtils.js';
import { aiSmartSplit } from './utils/ai/SmartSplit.js';     // <--- 路径指向 components
import { calcSSSAllScores } from './components/sssScore.js';   // <--- 已修正路径

const BACKEND_DOMAIN = "https://9525.ip-ddns.com"; // 您的后端域名

export default function App() {
  const [roomId, setRoomId] = useState('');
  const [playerIdx, setPlayerIdx] = useState(null);
  const [view, setView] = useState('lobby'); // 'lobby' 或 'game'
  const [isTryPlay, setIsTryPlay] = useState(false);
  const [msg, setMsg] = useState('欢迎来到十三水游戏');
  
  // 游戏状态
  const [localGameState, setLocalGameState] = useState(null);
  const onlineGameState = usePollingGameState(roomId, isTryPlay ? null : 1500);
  const gameState = isTryPlay ? localGameState : onlineGameState;

  // 统一的重置函数
  const resetToLobby = () => {
    setRoomId('');
    setPlayerIdx(null);
    setView('lobby');
    setIsTryPlay(false);
    setLocalGameState(null);
    setMsg('欢迎来到十三水游戏');
  };

  // 创建房间 (联机)
  const createRoom = async () => {
    setMsg("正在创建房间...");
    const res = await fetch(`${BACKEND_DOMAIN}/api/create-room.php`, { method: "POST" });
    const data = await res.json();
    setRoomId(data.room_id);
    setPlayerIdx('0');
    setIsTryPlay(false);
    setView('game');
    setMsg(`房间已创建: ${data.room_id}，等待其他玩家加入...`);
  };

  // 加入房间 (联机)
  const joinRoom = async () => {
    if (!roomId) return setMsg("请输入房间号");
    setMsg("正在加入房间...");
    const res = await fetch(`${BACKEND_DOMAIN}/api/join-room.php?room_id=${roomId}`, { method: "POST" });
    const data = await res.json();
    if (data.error) return setMsg(data.error);
    setPlayerIdx(data.player_idx.toString());
    setIsTryPlay(false);
    setView('game');
    setMsg(`成功加入房间，你是座位 ${data.player_idx}。`);
  };

  // 开始试玩 (单机)
  const startTryPlay = () => {
    setMsg('试玩模式已开始，请理牌。');
    setIsTryPlay(true);
    setPlayerIdx('0');

    const deck = createDeck();
    const shuffledDeck = shuffleDeck(deck);
    let currentDeck = [...shuffledDeck];

    const players = Array(4).fill(null).map((_, i) => {
      const hand = currentDeck.splice(0, 13);
      if (i === 0) { // 人类玩家
        return { hand, dun: null };
      } else { // AI玩家
        const splitResult = aiSmartSplit(hand); 
        return { hand, dun: { dun1: splitResult.head, dun2: splitResult.middle, dun3: splitResult.tail } };
      }
    });
    
    setLocalGameState({ players, status: 'playing', scores: [0,0,0,0] });
    setView('game');
  };
  
  // 发牌 (联机)
  const startGame = async () => {
    setMsg("正在发牌...");
    await fetch(`${BACKEND_DOMAIN}/api/start-game.php`, {
      method: 'POST',
      headers: {'Content-Type':'application/x-www-form-urlencoded'},
      body: `room_id=${roomId}`
    });
  };

  // 提交理牌 (统一处理)
  const submitDun = async (duns) => { // duns 格式是 { dun1, dun2, dun3 }
    setMsg("理牌已提交，等待其他玩家...");
    if (isTryPlay) {
        const updatedPlayers = [...localGameState.players];
        updatedPlayers[playerIdx].dun = duns;

        // 检查是否所有人都已理牌
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

  // 再来一局 (联机)
  const resetGame = async () => {
    setMsg("正在准备新一局...");
    await fetch(`${BACKEND_DOMAIN}/api/reset-room.php`, {
        method: 'POST',
        headers: {'Content-Type':'application/x-www-form-urlencoded'},
        body: `room_id=${roomId}`
    });
  };

  // 渲染大厅
  const renderLobby = () => (
    <div style={{ padding: 20, maxWidth: '400px', margin: 'auto', textAlign: 'center' }}>
      <h1>十三水</h1>
      <div style={{ color: "red", minHeight: '20px', marginBottom: '10px' }}>{msg}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button onClick={startTryPlay}>单机试玩 (vs 3 AI)</button>
        <hr/>
        <button onClick={createRoom}>创建多人房间</button>
        <div>
          <input placeholder="输入房间号加入" value={roomId} onChange={e => setRoomId(e.target.value)} style={{ marginRight: '8px' }} />
          <button onClick={joinRoom}>加入房间</button>
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
          onResetGame={isTryPlay ? startTryPlay : resetGame}
          msg={msg}
        />
      )}
    </div>
  );
}
