import React from 'react';
import Hand from './Hand';
import Play from './Play';
import './GameBoard.css';

function GameBoard({ player, opponent, onPlay, onCompare, message, result, onRestart }) {
  return (
    <div className="game-board">
      <div className="opponent-area">
        <div className="player-info">
          <h2>{opponent.name}</h2>
          <p>Cards: {opponent.cardCount}</p>
        </div>
        <div className="plays">
          {opponent.plays.map((play, index) => (
            <Play key={index} cards={play.cards} type={play.type} />
          ))}
        </div>
      </div>

      <div className="player-area">
        <div className="player-info">
          <h2>{player.name}</h2>
        </div>
        <Hand cards={player.hand} onPlay={onPlay} />
      </div>

      <div className="actions">
        <button onClick={onCompare} disabled={!player.canCompare}>Compare</button>
        <p className="message">{message}</p>
      </div>

      {result && (
        <div className="result-modal">
          <div className="result-content">
            <h2>{result.message}</h2>
            <button onClick={onRestart}>Play Again</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default GameBoard;
