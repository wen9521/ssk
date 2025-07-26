// frontend/src/games/doudizhu/ui/DoudizhuPlay.jsx
import React, { useState } from 'react';
import useDoudizhuStore from '../store/doudizhuStore';
import { Hand } from '../../../components';
import GameOver from '../../../components/common/GameOver'; // Import GameOver
import './Doudizhu.css';

const DoudizhuPlay = () => {
  const { gameState, players, winner, deal, playCards, pass } = useDoudizhuStore();
  const [selectedCards, setSelectedCards] = useState([]);

  // ... (event handlers)

  return (
    <div className="game-board doudizhu-board">
      {gameState === 'finished' && (
        <GameOver 
          result={winner === 'player' ? 'win' : 'lose'}
          onRestart={deal}
        />
      )}
      
      {/* ... rest of the game board ... */}

      <div className="player-area">
        <div className="player-info main-player">
          <h3>你 {players.player.isLandlord && ' (地主)'}</h3>
          <Hand 
            cards={players.player.hand}
            onCardClick={(card) => { /* ... */ }}
            selectedCards={selectedCards}
          />
        </div>
        <div className="actions">
          {/* ... buttons ... */}
        </div>
      </div>
    </div>
  );
};

export default DoudizhuPlay;
