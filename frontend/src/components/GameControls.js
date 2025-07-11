import React from 'react';

const GameControls = ({ onDeal, onCompare, onReset, canDeal, canCompare }) => {
  return (
    <div className="game-controls">
      <button 
        className="control-button deal-button"
        onClick={onDeal}
        disabled={!canDeal}
      >
        发牌
      </button>
      
      <button 
        className="control-button compare-button"
        onClick={onCompare}
        disabled={!canCompare}
      >
        比牌
      </button>
      
      <button 
        className="control-button reset-button"
        onClick={onReset}
      >
        重置
      </button>
    </div>
  );
};

export default GameControls;