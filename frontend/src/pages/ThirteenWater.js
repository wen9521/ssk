import React from 'react';
import { useNavigate } from 'react-router-dom';

const ThirteenWater = () => {
  const navigate = useNavigate();

  const handleStartGame = () => {
    navigate('/thirteen-water/play');
  };

  return (
    <div>
      <h1>Thirteen Water</h1>
      <button onClick={handleStartGame}>Start Game</button>
    </div>
  );
};

export default ThirteenWater;
