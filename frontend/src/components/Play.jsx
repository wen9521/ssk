// src/components/Play.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GameBoard from './GameBoard';
import { useGameStore } from '../utils/store';
import './Play.css';

export default function Play() {
  const navigate = useNavigate();
  const {
    players,
    stage,
    resetRound,
    setPlayerReady,
    updatePlayerHands,
    submitHands,
    autoSplitForPlayer
  } = useGameStore();

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

  // --- 核心修复：重新添加 play-container ---
  return (
    <div className="play-container">
      <GameBoard
        players={players}
        myPlayerId="player1"
        stage={stage}
        onReady={handleReady}
        onCompare={submitHands}
        onRestart={resetRound}
        onQuit={handleQuit}
        onUpdateHands={updatePlayerHands}
        onAutoSplit={autoSplitForPlayer}
        gameMode="thirteen-cards"
      />
    </div>
  );
}
