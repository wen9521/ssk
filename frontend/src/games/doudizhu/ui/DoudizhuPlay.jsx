// frontend/src/games/doudizhu/ui/DoudizhuPlay.jsx
import React, { useState, useEffect } from 'react'; // Import useEffect
import useDoudizhuStore from '../store/doudizhuStore';
import { Hand } from '../../../components';
import GameOver from '../../../components/common/GameOver';
import './Doudizhu.css';

const DoudizhuPlay = () => {
  const { gameState, players, winner, deal, playCards, pass } = useDoudizhuStore();
  const [selectedCards, setSelectedCards] = useState([]);

  // --- THIS IS THE FIX ---
  // On component mount, if the game hasn't started, deal the cards.
  useEffect(() => {
    if (gameState === 'waiting') {
      deal();
    }
  }, [gameState, deal]); // Dependencies ensure this runs only when needed

  // ... (event handlers)

  return (
    <div className="game-board doudizhu-board">
      {/* ... rest of the component ... */}
    </div>
  );
};

export default DoudizhuPlay;
