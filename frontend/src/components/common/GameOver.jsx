// frontend/src/components/common/GameOver.jsx
import React from 'react';
import './GameOver.css';

const GameOver = ({ result, score, onRestart }) => {
  const resultText = result === 'win' ? '胜利' : '失败';
  const resultClass = result === 'win' ? 'win' : 'lose';

  return (
    <div className="game-over-overlay">
      <div className={`game-over-modal ${resultClass}`}>
        <h2 className="result-title">{resultText}</h2>
        {score && <p className="score-display">得分: {score}</p>}
        <button onClick={onRestart} className="restart-button">
          再玩一局
        </button>
      </div>
    </div>
  );
};

export default GameOver;
