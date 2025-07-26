// src/components/Play.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GameBoard from './GameBoard';
import { useGameStore } from '../utils/store';
import './Play.css';

export default function Play() {
  const navigate = useNavigate();
  const store = useGameStore();

  useEffect(() => {
    store.resetRound();
  }, [store.resetRound]);

  const me = store.players.find(p => p.id === 'player1');
  if (!me) {
    return <div>Loading...</div>;
  }

  return (
    <div className="play-container">
      <div className="game-wrapper">
        <GameBoard
          players={store.players}
          myPlayerId="player1"
          stage={store.stage}
          onReady={() => store.setPlayerReady('player1')}
          onCompare={store.submitHands}
          onRestart={store.resetRound}
          onQuit={() => navigate('/')}
          onUpdateHands={store.updatePlayerHands}
          onAutoSplit={store.autoSplitForPlayer}
          // gameMode="thirteen-cards" 属性已移除
        />
      </div>
    </div>
  );
}