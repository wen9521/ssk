import React from 'react';
import Card from './Card';

const CardComparison = ({ player1, player2, result }) => {
  return (
    <div className="card-comparison">
      <div className="comparison-header">
        <h3>牌型对比</h3>
      </div>
      
      <div className="comparison-players">
        <div className="player-comparison">
          <div className="player-name">玩家1</div>
          <div className="player-cards">
            {player1.map((card, index) => (
              <Card key={index} card={card} size="small" />
            ))}
          </div>
        </div>
        
        <div className="vs">VS</div>
        
        <div className="player-comparison">
          <div className="player-name">玩家2</div>
          <div className="player-cards">
            {player2.map((card, index) => (
              <Card key={index} card={card} size="small" />
            ))}
          </div>
        </div>
      </div>
      
      {result && (
        <div className="comparison-result">
          <div className={`result-badge ${result.winner === 'player1' ? 'winner' : 'loser'}`}>
            {result.winner === 'player1' ? '胜' : '负'}
          </div>
          <div className="result-details">
            <p>{result.player1Type} vs {result.player2Type}</p>
            <p>{result.reason}</p>
          </div>
          <div className={`result-badge ${result.winner === 'player2' ? 'winner' : 'loser'}`}>
            {result.winner === 'player2' ? '胜' : '负'}
          </div>
        </div>
      )}
    </div>
  );
};

export default CardComparison;