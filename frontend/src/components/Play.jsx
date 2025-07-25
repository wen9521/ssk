// src/components/Play.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GameBoard from './GameBoard';
import { useGameStore } from '../utils/store';
import './Play.css'; // <--- **添加这一行，加载样式！**

export default function Play() {
  const navigate = useNavigate();
  const {
    players,
    stage,
    resetRound,
    setPlayerReady,
    updatePlayerHands,
    submitHands
  } = useGameStore();

  // 组件加载时重置牌局
  useEffect(() => {
    resetRound();
  }, [resetRound]);

  const handleReady = () => {
    setPlayerReady('player1');
  };

  const handleQuit = () => {
    navigate('/');
  };

  const me = players.find(p => p.id === 'player1');
  if (!me) {
    return <div>Loading...</div>;
  }
  return (
    <GameBoard
      players={players}
      myPlayerId="player1"
      stage={stage}
      onReady={handleReady}
      onCompare={submitHands}
      onRestart={resetRound}
      onQuit={handleQuit}
      onUpdateHands={(playerId, newHands) => updatePlayerHands(playerId, newHands)}
    />
  );
}