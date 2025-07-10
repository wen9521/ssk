import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Lobby.css';

const Lobby = () => {
  const navigate = useNavigate();

  return (
    <div className="lobby-container">
      <div className="game-title">
        <div className="title-logo">♠️♥️♦️♣️</div>
        <h1>十三水</h1>
        <p className="subtitle">经典扑克游戏</p>
      </div>

      <div className="game-options">
        <div className="option-card">
          <div className="card-icon">🕹️</div>
          <h3>快速开始</h3>
          <p>与AI对战，随时享受游戏乐趣</p>
        </div>
        
        <button 
          onClick={() => navigate('/game')}
          className="start-button"
        >
          开始游戏
        </button>
        
        <div className="game-stats">
          <div className="stat-item">
            <span>🎮</span>
            <p>在线玩家</p>
            <strong>1,245</strong>
          </div>
          <div className="stat-item">
            <span>🏆</span>
            <p>今日对局</p>
            <strong>8,763</strong>
          </div>
        </div>
      </div>
      
      <div className="lobby-footer">
        <p>© 2023 十三水游戏 | 移动端优化版</p>
      </div>
    </div>
  );
};

export default Lobby;