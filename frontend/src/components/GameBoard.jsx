import React from 'react';
import Hand from './Hand';
import './GameBoard.css';

// 这是一个表示单一道（如头道、中道、尾道）的组件
const HandSegment = ({ title, cards, type }) => (
  <div className="hand-segment">
    <h3>{title} <span className="hand-type">{type}</span></h3>
    <div className="card-placeholder">
      {cards.map((card, index) => (
        <img key={index} src={`${process.env.PUBLIC_URL}/assets/cards/${card.rank === 'T' ? '10' : card.rank}_of_${card.suit}.svg`} alt={`${card.rank} of ${card.suit}`} />
      ))}
    </div>
  </div>
);

function GameBoard({ player, opponent, onPlay, onCompare, onRestart, message, result }) {
  return (
    <div className="game-board-container">
      {/* 对手区域 */}
      <div className="opponent-area">
        <div className="player-avatar">{opponent.name.charAt(0)}</div>
        <div className="player-details">
          <strong>{opponent.name}</strong>
          <span>剩余牌数: {opponent.cardCount}</span>
        </div>
        <div className="opponent-segments">
            {/* 这里将来显示对手摆好的牌 */}
        </div>
      </div>

      {/* 桌面中心区域 */}
      <div className="table-center">
        {result ? (
            <div className="result-modal">
              <h2>{result.message}</h2>
              <button className="btn" onClick={onRestart}>再玩一局</button>
            </div>
        ) : (
            <p className="game-message">{message}</p>
        )}
      </div>

      {/* 玩家区域 */}
      <div className="player-area">
        <div className="player-main-hand">
            <Hand cards={player.hand} onPlay={onPlay} />
        </div>
        <div className="player-segments">
            <HandSegment title="头道" cards={player.plays[0]?.cards || []} type={player.plays[0]?.type || ''} />
            <HandSegment title="中道" cards={player.plays[1]?.cards || []} type={player.plays[1]?.type || ''}/>
            <HandSegment title="尾道" cards={player.plays[2]?.cards || []} type={player.plays[2]?.type || ''}/>
        </div>
        <div className="player-controls">
             <div className="player-avatar self">{player.name.charAt(0)}</div>
             <button className="btn" onClick={() => { alert('自动理牌功能开发中！'); }}>自动理牌</button>
             <button className="btn" onClick={onCompare} disabled={!player.canCompare}>确定比牌</button>
        </div>
      </div>
    </div>
  );
}

export default GameBoard;
