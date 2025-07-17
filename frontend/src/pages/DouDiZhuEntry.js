import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../Play.css'; // 引入Play.css以共用样式

function DouDiZhuEntry() {
  const navigate = useNavigate();

  const handlePlayNow = () => {
    navigate('/doudizhu/play'); // 跳转到斗地主牌桌页面
  };

  const handleJoinRoom = () => {
    alert('加入房间功能正在开发中，敬请期待！');
  };

  return (
    <div className="play-container">
      <div className="play-inner-wrapper thirteen-water-entry">
        <div className="header-controls">
          <button className="exit-button" onClick={() => navigate('/')}>&lt; 返回大厅</button>
        </div>
        <h1 className="entry-title">斗地主</h1>
        <p className="entry-description">经典三人对抗，炸弹乐趣多</p>
        <div className="entry-buttons-container">
          <button className="action-button play-now-button" onClick={handlePlayNow}>
            试玩 (自动匹配AI)
          </button>
          <button className="action-button join-room-button" onClick={handleJoinRoom}>
            加入房间 (未开放)
          </button>
        </div>
      </div>
    </div>
  );
}

export default DouDiZhuEntry;
