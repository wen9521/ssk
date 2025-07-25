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
    submitHands
    // 八张游戏没有 updatePlayerHands 和 onAutoSplit
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
        // 八张模式不传递 onUpdateHands 和 onAutoSplit
        gameMode="eight-cards"
      />
    </div>
  );
}
