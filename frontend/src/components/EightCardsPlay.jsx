// frontend/src/components/EightCardsPlay.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GameBoard from './GameBoard';
import { useEightCardsStore } from '../utils/eight-cards.store';
import './Play.css'; // 继续复用十三水的样式

export default function EightCardsPlay() {
  const navigate = useNavigate();
  const store = useEightCardsStore();

  useEffect(() => {
    store.resetRound();
  }, [store.resetRound]);

  const me = store.players.find(p => p.id === 'player1');
  if (!me) {
    return <div>正在加载八张游戏...</div>;
  }

  return (
    <div className="play-container">
      {/* 八张游戏使用 'six-players' 类来改变布局 */}
      <div className="game-wrapper six-players"> 
        <GameBoard
          players={store.players}
          myPlayerId="player1"
          stage={store.stage}
          onReady={() => store.setPlayerReady('player1')}
          onCompare={store.submitHands}
          onRestart={store.resetRound}
          onQuit={() => navigate('/')}
          // 八张模式不传递 onUpdateHands 和 onAutoSplit
          gameMode="eight-cards"
        />
      </div>
    </div>
  );
}
