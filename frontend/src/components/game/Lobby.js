// This is a placeholder for the Lobby component.
import React from 'react';
import '../../styles/Lobby.css'; // 引入新的样式文件

const Lobby = ({ msg, roomId, isActionDisabled, onSetRoomId, onStartTryPlay, onCreateRoom, onJoinRoom }) => {
  return (
    <div className="lobby-container">
      <div className="game-title">
        <h1>十三水</h1>
        <p className="subtitle">单机 & 多人扑克游戏</p>
      </div>

      <div className="message">{msg}</div>

      <div className="game-options">
        <button onClick={onStartTryPlay} disabled={isActionDisabled} className="option-button">
          <div className="option-title">单机试玩 (vs 3 AI)</div>
          <div className="option-desc">立即开始一局，体验AI智能理牌</div>
        </button>

        <div className="option-divider">或</div>

        <button onClick={onCreateRoom} disabled={isActionDisabled} className="option-button">
          <div className="option-title">创建多人房间</div>
          <div className="option-desc">邀请好友一起对战</div>
        </button>

        <div className="join-room">
          <input
            placeholder="输入房间号加入"
            value={roomId}
            onChange={e => onSetRoomId(e.target.value)}
            disabled={isActionDisabled}
          />
          <button onClick={onJoinRoom} disabled={isActionDisabled || !roomId}>
            加入房间
          </button>
        </div>
      </div>
    </div>
  );
};

export default Lobby;