// src/components/thirteenWater/Play.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GameBoard from './GameBoard'; // 相对路径导入
import { useThirteenWaterStore } from '../../store/thirteenWaterStore'; // 从新的Store导入
import './Play.css'; // 相对路径导入

export default function ThirteenWaterPlay() { // 重命名组件以示区分
  const navigate = useNavigate();
  const store = useThirteenWaterStore();

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
        />
      </div>
    </div>
  );
}
