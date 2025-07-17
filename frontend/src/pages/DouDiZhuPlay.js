import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../Play.css'; // 引入Play.css以共用样式

function DouDiZhuPlay() {
  const navigate = useNavigate();
  return (
    <div className="play-container">
      <div className="play-inner-wrapper thirteen-water-entry">
        <div className="header-controls">
          <button className="exit-button" onClick={() => navigate('/doudizhu')}>&lt; 返回斗地主入口</button>
        </div>
        <h1 className="entry-title">斗地主游戏</h1>
        <p className="entry-description">核心游戏逻辑正在开发中，敬请期待！</p>
        <div className="entry-buttons-container">
          <button className="action-button join-room-button" onClick={() => navigate('/')}>返回大厅</button>
        </div>
      </div>
    </div>
  );
}

export default DouDiZhuPlay;
