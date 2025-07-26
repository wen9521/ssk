// frontend/src/games/thirteenWater/ui/Play.jsx
import React, { useEffect } from 'react';
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

  useEffect(() => {
    if (gameState === 'waiting') {
      dealCards();
    }
  }, [gameState, dealCards]);

  // --- THIS IS THE FIX ---
  // Add checks to ensure playerHand and playerArrangement are defined before rendering.

  // ... (event handlers)

  return (
    <div className="game-board thirteen-water-board">
      {gameState === 'finished' && winner && scores && (
        <GameOver
          result={winner === 'player' ? 'win' : 'lose'}
          score={scores.player}
          onRestart={dealCards}
        />
      )}

      {/* Example of conditional rendering for player hand */}
      <div className="player-area">
        <h2>你的牌</h2>
        {playerHand && Array.isArray(playerHand) && <Hand cards={playerHand} />}

        {/* Add similar checks for playerArrangement zones and other data structures used in rendering */}
        {/* For example: */}
        {/* {playerArrangement?.front && Array.isArray(playerArrangement.front) && <ArrangementZone cards={playerArrangement.front} zone="front" />} */}
        {/* {playerArrangement?.middle && Array.isArray(playerArrangement.middle) && <ArrangementZone cards={playerArrangement.middle} zone="middle" />} */}
        {/* {playerArrangement?.back && Array.isArray(playerArrangement.back) && <ArrangementZone cards={playerArrangement.back} zone="back" />} */}

      </div>

      {/* Add checks for opponent areas if they exist in the component */}
      {/* For example: */}
      {/* <div className="opponent-area"> */}
      {/*   {opponentHand && Array.isArray(opponentHand) && <OpponentHand cards={opponentHand} />} */}
      {/* </div> */}

      {/* ... rest of the game board will now render correctly ... */}
    </div>
  );
};

export default ThirteenWaterPlay;
