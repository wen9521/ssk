import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Play.css'; // Shared styles
import '../styles/BigTwoPlay.css'; // Specific styles for Big Two

const AI_NAMES = ['AI玩家一', 'AI玩家二', 'AI玩家三'];

function BigTwoPlay() {
  const navigate = useNavigate();
  const [msg, setMsg] = useState('等待玩家加入...');
  const [isReady, setIsReady] = useState(false);
  
  const [players, setPlayers] = useState([
    { name: '你', isMe: true, isReady: false, cardCount: 13 },
    { name: AI_NAMES[0], isMe: false, isReady: false, cardCount: 13 },
    { name: AI_NAMES[1], isMe: false, isReady: false, cardCount: 13 },
    { name: AI_NAMES[2], isMe: false, isReady: false, cardCount: 13 },
  ]);

  const handleReadyToggle = () => {
    const newReadyState = !isReady;
    setIsReady(newReadyState);
    setMsg(newReadyState ? '已准备，等待其他玩家...' : '');
    setPlayers(prev => prev.map(p => p.isMe ? { ...p, isReady: newReadyState } : p));
    
    if (newReadyState) {
        setTimeout(() => {
          setPlayers(prev => prev.map(p => !p.isMe ? { ...p, isReady: true } : p));
          setMsg('所有玩家已准备，可以开始游戏！');
        }, 1500);
    }
  };

  const handlePlayCards = () => {
    setMsg('你出牌了！');
  };

  const renderPlayerSeat = (player, positionClass) => {
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
  
  const me = players.find(p => p.isMe);
  const otherPlayers = players.filter(p => !p.isMe);
  
  return (
    <div className="play-container big-two-play-container">
      <div className="play-inner-wrapper">
        <div className="header-controls">
          <button className="exit-button" onClick={() => navigate('/big-two')}>
            &lt; 返回入口
          </button>
          <div className="score-display">
            <span role="img" aria-label="coin" className="score-icon">🪙</span>
            积分：100
          </div>
        </div>

        <div className="game-area">
          {otherPlayers[1] && renderPlayerSeat(otherPlayers[1], 'player-top')}
          {otherPlayers[0] && renderPlayerSeat(otherPlayers[0], 'player-left')}
          
          <div className="game-table-area">
            {/* Played cards will go here */}
            <p>锄大地牌桌</p>
          </div>
          
          {otherPlayers[2] && renderPlayerSeat(otherPlayers[2], 'player-right')}
          
          <div className="player-bottom">
            <div className="my-hand-area">
                {/* Player's cards will be rendered here */}
                 <div className="card-placeholder">你的手牌区域</div>
            </div>
            <div className="my-info-area">
               {me && (
                  <div className={`play-seat me ${me.isReady ? 'ai-done' : ''}`}>
                     <div>{me.name}</div>
                      <div className="play-seat-status">{me.isReady ? '已准备' : '请准备'}</div>
                  </div>
               )}
               <div className="buttons-container">
                  <button
                    className={`action-button ready-button ${isReady ? 'cancel' : ''}`}
                    onClick={handleReadyToggle}
                  >
                    {isReady ? '取消准备' : '准备'}
                  </button>
                  <button
                    className="action-button start-compare-button"
                    onClick={handlePlayCards}
                    disabled={!isReady}
                  >
                    出牌
                  </button>
               </div>
            </div>
          </div>
        </div>

        <div className="message-display">
          {msg}
        </div>
      </div>
    </div>
  );
}

export default BigTwoPlay;
