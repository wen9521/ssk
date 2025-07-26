// frontend/src/games/thirteenWater/ui/Play.jsx
import React from 'react';
import useThirteenWaterStore from '../store/thirteenWaterStore';
import { Hand } from '../../../components';
import GameOver from '../../../components/common/GameOver'; // Import GameOver
import './Play.css';

// ... (ArrangementZone component)

const ThirteenWaterPlay = () => {
  const { 
    gameState, playerHand, playerArrangement, winner, scores,
    dealCards, setPlayerArrangement 
  } = useThirteenWaterStore();

  // ... (event handlers)

  return (
    <div className="game-board thirteen-water-board">
      {gameState === 'finished' && (
        <GameOver
          result={winner === 'player' ? 'win' : 'lose'}
          score={scores.player}
          onRestart={dealCards}
        />
      )}

      {/* ... rest of the game board ... */}
    </div>
  );
};

export default ThirteenWaterPlay;
