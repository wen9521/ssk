import React from 'react';

const PlayerSeat = ({ player, positionClass }) => {
  return (
    <div className={`player-seat-wrapper ${positionClass}`}>
      <div className={`play-seat ${player.isMe ? 'me' : ''} ${player.isReady ? 'ai-done' : ''}`}>
        <div>{player.name}</div>
        <div className="play-seat-status">
          {player.isMe ? (player.isReady ? '已准备' : '未准备') : `剩余: ${player.cardCount}`}
        </div>
      </div>
    </div>
  );
};

export default PlayerSeat;
