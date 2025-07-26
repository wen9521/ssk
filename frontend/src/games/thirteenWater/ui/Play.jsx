// frontend/src/games/thirteenWater/ui/Play.jsx
import React, { useEffect } from 'react'; // Import useEffect
import useThirteenWaterStore from '../store/thirteenWaterStore';
import { Hand } from '../../../components';
import GameOver from '../../../components/common/GameOver';
import './Play.css';

// ... (ArrangementZone component remains the same)

const ThirteenWaterPlay = () => {
  const { 
    gameState, playerHand, playerArrangement, winner, scores,
    dealCards, setPlayerArrangement 
  } = useThirteenWaterStore();

  // --- THIS IS THE FIX ---
  // On component mount, if the game hasn't started, deal the cards.
  useEffect(() => {
    if (gameState === 'waiting') {
      dealCards();
    }
  }, [gameState, dealCards]); // Dependencies ensure this runs only when needed

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

      {/* ... rest of the game board will now render correctly ... */}
      <div className="opponent-area">
        {/* ... */}
      </div>
      <div className="player-area">
        <h2>你的牌</h2>
        <Hand cards={playerHand} />
        {/* ... arrangement zones and actions ... */}
      </div>
    </div>
  );
};

export default ThirteenWaterPlay;
