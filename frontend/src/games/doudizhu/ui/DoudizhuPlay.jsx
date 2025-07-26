// frontend/src/games/doudizhu/ui/DoudizhuPlay.jsx
import React, { useState, useEffect } from 'react';
import useDoudizhuStore from '../store/doudizhuStore';
import { Hand } from '../../../components';
import GameOver from '../../../components/common/GameOver';
import './Doudizhu.css';

const DoudizhuPlay = () => {
  const { gameState, players, winner, deal, playCards, pass } = useDoudizhuStore();
  const [selectedCards, setSelectedCards] = useState([]);

  useEffect(() => {
    if (gameState === 'waiting') {
      deal();
    }
  }, [gameState, deal]);

  // --- THIS IS THE FIX ---
  // Add checks to ensure players and player hands are defined before rendering.

  const player = players?.player;
  const opponent1 = players?.opponent1; // Assuming three players for Doudizhu
  const opponent2 = players?.opponent2; // Assuming three players for Doudizhu

  // ... (event handlers)

  return (
    <div className="game-board doudizhu-board">
      {/* Example of conditional rendering for player hand */}
      {player?.hand && Array.isArray(player.hand) && <Hand cards={player.hand} />}

      {/* Add similar checks for opponent hands and other data structures used in rendering */}
      {/* For example: */}
      {/* {opponent1?.hand && Array.isArray(opponent1.hand) && <OpponentHand cards={opponent1.hand} />} */}
      {/* {opponent2?.hand && Array.isArray(opponent2.hand) && <OpponentHand cards={opponent2.hand} />} */}
      {/* {gameState === 'finished' && winner && <GameOver result={winner === 'player' ? 'win' : 'lose'} onRestart={deal} />} */}

      {/* ... rest of the component ... */}
    </div>
  );
};

export default DoudizhuPlay;
