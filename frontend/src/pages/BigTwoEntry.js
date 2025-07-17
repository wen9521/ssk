import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../Play.css'; // 引入Play.css以共用样式

function BigTwoEntry() {
  const navigate = useNavigate();

  const handlePlayNow = () => {
    navigate('/big-two/play'); // 跳转到锄大地牌桌页面
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
        <h1 className="entry-title">锄大地</h1>
        <p className="entry-description">出牌技巧与团队配合</p>
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

export default BigTwoEntry;
