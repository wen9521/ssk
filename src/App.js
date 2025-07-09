jsx
import React, { useState, useEffect } from 'react';
import usePollingGameState from './hooks/usePollingGameState';
import PokerTable from './components/game/PokerTable';
import { createDeck, shuffleDeck } from './utils/game/cardUtils.js';
import { aiSmartSplit } from './utils/ai/SmartSplit.js';
import { calcSSSAllScores } from './utils/game/sssScore.js';

const BACKEND_DOMAIN = "https://9525.ip-ddns.com";

export default function App() {
  const [roomId, setRoomId] = useState('');
  const [playerIdx, setPlayerIdx] = useState(null);
  const [view, setView] = useState('lobby');
  const [isTryPlay, setIsTryPlay] = useState(false);
  const [msg, setMsg] = useState('欢迎来到十三水游戏');
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
    try {
      const res = await fetch(`${BACKEND_DOMAIN}/api/create-room.php`, { method: "POST" });
      const data = await res.json();
      setRoomId(data.room_id);
      setPlayerIdx('0');
      setIsTryPlay(false);
      setView('game');
      setMsg(`房间已创建: ${data.room_id}，等待其他玩家加入...`);
    } catch (error) {
      setMsg("创建房间失败，请重试");
      console.error("创建房间错误:", error);
    }
  };

  // 加入房间 (联机)
  const joinRoom = async () => {
    if (!roomId) return setMsg("请输入房间号");
    setMsg("正在加入房间...");
    try {
      const res = await fetch(`${BACKEND_DOMAIN}/api/join-room.php?room_id=${roomId}`, { method: "POST" });
      const data = await res.json();
      if (data.error) return setMsg(data.error);
      setPlayerIdx(data.player_idx.toString());
      setIsTryPlay(false);
      setView('game');
      setMsg(`成功加入房间，你是座位 ${data.player_idx}。`);
    } catch (error) {
      setMsg("加入房间失败，请重试");
      console.error("加入房间错误:", error);
    }
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
    try {
      await fetch(`${BACKEND_DOMAIN}/api/start-game.php`, {
        method: 'POST',
        headers: {'Content-Type':'application/x-www-form-urlencoded'},
        body: `room_id=${roomId}`
      });
    } catch (error) {
      setMsg("发牌失败，请重试");
      console.error("发牌错误:", error);
    }
  };

  // 提交理牌 (统一处理)
  const submitDun = async (duns) => {
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
      try {
        await fetch(`${BACKEND_DOMAIN}/api/set-dun.php`, {
          method: "POST",
          headers: {'Content-Type':'application/x-www-form-urlencoded'},
          body: `room_id=${roomId}&player_idx=${playerIdx}&dun=${encodeURIComponent(JSON.stringify(duns))}`
        });
      } catch (error) {
        setMsg("提交理牌失败，请重试");
        console.error("提交理牌错误:", error);
      }
    }
  };

  // 再来一局 (联机)
  const resetGame = async () => {
    setMsg("正在准备新一局...");
    try {
      await fetch(`${BACKEND_DOMAIN}/api/reset-room.php`, {
        method: 'POST',
        headers: {'Content-Type':'application/x-www-form-urlencoded'},
        body: `room_id=${roomId}`
      });
    } catch (error) {
      setMsg("重置游戏失败，请重试");
      console.error("重置游戏错误:", error);
    }
  };

  // 渲染大厅
  const renderLobby = () => (
    <div className="lobby-container">
      <div className="game-title">
        <h1>十三水</h1>
        <div className="subtitle">经典扑克牌游戏</div>
      </div>

      <div className="message">{msg}</div>

      <div className="game-options">
        <button className="option-button" onClick={startTryPlay}>
          <div className="option-title">单机试玩</div>
          <div className="option-desc">与3个AI对战</div>
        </button>

        <div className="option-divider">或</div>

        <button className="option-button" onClick={createRoom}>
          <div className="option-title">创建房间</div>
          <div className="option-desc">邀请好友加入</div>
        </button>

        <div className="join-room">
          <input
            placeholder="输入房间号"
            value={roomId}
            onChange={e => setRoomId(e.target.value)}
          />
          <button onClick={joinRoom}>加入房间</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="app-container">
      {view !== 'lobby' && (
        <button className="back-button" onClick={resetToLobby}>
          &larr; 返回大厅
        </button>
      )}

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