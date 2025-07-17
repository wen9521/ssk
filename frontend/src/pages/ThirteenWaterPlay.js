import React, { useEffect } from 'react';
// import { sortCards } from '../CardUtils'; // This was unused
import '../styles/ThirteenWaterPlay.css';

const ThirteenWaterPlay = () => {
  // These were not being updated, so they don't need to be state variables.
  const frontDun = ['5_of_clubs', 'queen_of_spades', 'ace_of_diamonds'];
  const middleDun = [];
  const backDun = [];

  useEffect(() => {
    // Initial card distribution can be set here if needed
  }, []);

  const renderCards = (cards) => {
    if (!cards || cards.length === 0) {
      return <div className="empty-dun-placeholder">请放置牌</div>;
    }
    return cards.map(card => (
      <img key={card} src={`/cards/${card}.svg`} alt={card} className="card" />
    ));
  };

  return (
    <div className="thirteen-water-play-container">
      <div className="top-bar">
        <button className="exit-button"> &lt; 退出房间</button>
        <div className="score-display">
          <span role="img" aria-label="coin">💰</span> 积分: 100
        </div>
      </div>

      <div className="player-status-container">
        <div className="player-box self">
          <strong>你</strong>
          <span>准备中...</span>
        </div>
        <div className="player-box">
          <strong>小明</strong>
          <span>已理牌</span>
        </div>
        <div className="player-box">
          <strong>小红</strong>
          <span>已理牌</span>
        </div>
        <div className="player-box">
          <strong>小刚</strong>
          <span>已理牌</span>
        </div>
      </div>

      {/* Reordered duns for logical display (Back > Middle > Front) */}
      <div className="duns-container">
        <div className="dun-area">
          <div className="card-row">{renderCards(backDun)}</div>
          <div className="dun-label">后道 (5张)</div>
        </div>
        <div className="dun-area">
          <div className="card-row">{renderCards(middleDun)}</div>
          <div className="dun-label">中道 (5张)</div>
        </div>
        <div className="dun-area">
          <div className="card-row">{renderCards(frontDun)}</div>
          <div className="dun-label">头道 (3张)</div>
        </div>
      </div>

      <div className="action-buttons">
        <button>取消准备</button>
        <button>智能分牌</button>
        <button className="start-compare">开始比牌</button>
      </div>
    </div>
  );
};

export default ThirteenWaterPlay;
