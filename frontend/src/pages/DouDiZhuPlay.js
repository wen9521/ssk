import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Play.css'; // 引入Play.css以共用样式

const AI_NAMES = ['AI玩家一', 'AI玩家二']; // 斗地主通常是2个AI

function DouDiZhuPlay() {
  const navigate = useNavigate();
  const [msg, setMsg] = useState('等待玩家加入...');
  const [isReady, setIsReady] = useState(false);
  
  // 简化模拟玩家状态，用于UI展示
  const [players, setPlayers] = useState([
    { name: '你', isMe: true, isReady: false },
    { name: AI_NAMES[0], isMe: false, isReady: false },
    { name: AI_NAMES[1], isMe: false, isReady: false },
  ]);

  const handleReadyToggle = () => {
    setIsReady(prev => !prev);
    setMsg(isReady ? '' : '已准备，等待其他玩家...');
    setPlayers(prev => prev.map(p => p.isMe ? { ...p, isReady: !prev.isReady } : p));
    // 模拟AI玩家自动准备
    setTimeout(() => {
      setPlayers(prev => prev.map(p => !p.isMe ? { ...p, isReady: true } : p));
      if (!isReady) setMsg('所有玩家已准备，可以开始游戏！');
    }, 1500);
  };

  const handleCallLandlord = () => {
    setMsg('你叫了地主！');
  };

  const handlePlayCards = () => {
    setMsg('你出牌了！');
  };

  function renderPlayerSeat(player) {
    return (
      <div
        key={player.name}
        className={`play-seat ${player.isMe ? 'me' : ''} ${player.isReady ? 'ai-done' : ''}`}
      >
        <div>{player.name}</div>
        <div className="play-seat-status">
          {player.isMe ? (player.isReady ? '已准备' : '未准备') : (player.isReady ? '已准备' : '等待中...')}
        </div>
      </div>
    );
  }

  return (
    <div className="play-container">
      <div className="play-inner-wrapper">
        {/* 头部：返回按钮+积分 */} 
        <div className="header-controls">
          <button
            className="exit-button"
            onClick={() => navigate('/doudizhu')}
          >
            &lt; 返回入口
          </button>
          <div className="score-display">
            <span role="img" aria-label="coin" className="score-icon">🪙</span>
            积分：100
          </div>
        </div>

        {/* 玩家区 */} 
        <div className="player-seats-container">
          {players.map(renderPlayerSeat)}
        </div>

        {/* 游戏牌桌区域 (占位) */} 
        <div className="game-table-area" style={{
          flex: 1,
          background: 'rgba(0,0,0,0.1)',
          borderRadius: '15px',
          margin: '20px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5em',
          color: 'rgba(255,255,255,0.6)',
          textShadow: '0 0 8px rgba(255,255,255,0.2)'
        }}>
          斗地主牌桌区域
        </div>

        {/* 底部按钮区 */} 
        <div className="buttons-container">
          <button
            className={`action-button ready-button ${isReady ? 'cancel' : ''}`}
            onClick={handleReadyToggle}
          >
            {isReady ? '取消准备' : '准备'}
          </button>
          <button
            className="action-button smart-split-button"
            onClick={handleCallLandlord}
            disabled={!isReady} // 简化：只有准备后才能叫地主
          >
            叫地主
          </button>
          <button
            className="action-button start-compare-button"
            onClick={handlePlayCards}
            disabled={!isReady} // 简化：只有准备后才能出牌
          >
            出牌
          </button>
        </div>

        <div className="message-display">
          {msg}
        </div>

      </div>
    </div>
  );
}

export default DouDiZhuPlay;
