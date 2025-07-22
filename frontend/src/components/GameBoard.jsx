import React from 'react';
import './GameBoard.css';

function GameBoard({ players, status }) {

  const renderPlayerSeat = (player, index) => {
    // In the future, we can distinguish the local player via a unique ID
    const isMe = index === 0; 
    const playerClass = `player-seat ${isMe ? 'player-me' : ''} ${player.isReady ? 'player-ready' : ''}`;
    
    return (
      <div key={player.id || index} className={playerClass}>
        <div className="player-avatar"></div>
        <div className="player-name">{player.name || `玩家 ${player.id}`}</div>
        <div className="player-status">
          {status === 'playing' && (player.hasSubmitted ? '已出牌' : '思考中...')}
          {status === 'waiting' && '等待中...'}
          {status === 'finished' && `得分: ${player.score}`}
        </div>
      </div>
    );
  };

  const renderFinalHands = () => {
    if (status !== 'finished') return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h2>本局结果</h2>
          <div className="result-grid">
            {players.map((player, index) => (
              <div key={player.id || index} className="result-player-summary">
                <div className="result-player-name">
                    {player.name || `Player ${player.id}`}
                    {player.isFoul && <span className="foul-tag">(倒水)</span>}
                    <span className="score-tag">({player.score}分)</span>
                </div>
                {/* We will need to render the 3 sets of cards here */}
                {/* This requires the server to send the final hands in the 'finished' state */}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="game-board-container">
        <div className="players-area">
            {players.map(renderPlayerSeat)}
        </div>
        {renderFinalHands()}
        <div className="game-status-display">
            状态: {status}
        </div>
    </div>
  );
}

export default GameBoard;
