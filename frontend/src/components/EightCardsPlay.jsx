// frontend/src/components/EightCardsPlay.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GameBoard from './GameBoard';
import { useEightCardsStore } from '../utils/eight-cards.store';
import './Play.css';

export default function EightCardsPlay() {
  const navigate = useNavigate();
  const {
    players,
    stage,
    resetRound,
    setPlayerReady,
    updatePlayerHands,
    submitHands
  } = useEightCardsStore();

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
    return <div>正在加载八张游戏...</div>;
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
      onUpdateHands={updatePlayerHands}
      gameMode="eight-cards" // <-- 传入特殊的游戏模式标识
    />
  );
}