import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../Play.css'; // 引入Play.css以共用样式

function ThirteenWaterEntry() {
  const navigate = useNavigate();

  const handlePlayNow = () => {
    navigate('/thirteen-water/play'); // 跳转到十三水牌桌页面
  };

  const handleJoinRoom = () => {
    alert('加入房间功能正在开发中，敬请期待！');
    // 实际应用中这里会有一个房间列表或输入房间号的界面
  };

  return (
    <div className="play-container">
      <div className="play-inner-wrapper thirteen-water-entry">
        <div className="header-controls">
          <button className="exit-button" onClick={() => navigate('/')}>&lt; 返回大厅</button>
        </div>
        <h1 className="entry-title">十三水</h1>
        <p className="entry-description">比拼牌型组合，体验策略与运气</p>
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

export default ThirteenWaterEntry;
