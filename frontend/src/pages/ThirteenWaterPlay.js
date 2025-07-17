import React, { useState, useEffect } from 'react';
import { sortCards } from '../CardUtils';
import '../styles/ThirteenWaterPlay.css';

const ThirteenWaterPlay = () => {
  const [frontDun, setFrontDun] = useState([]);
  const [middleDun, setMiddleDun] = useState(['5_of_clubs', 'queen_of_spades', 'ace_of_diamonds']);
  const [backDun, setBackDun] = useState([]);

  useEffect(() => {
    // Initial card distribution can be set here if needed
  }, []);

  const renderCards = (cards) => {
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
        <div className="player-box self">你<br/>你</div>
        <div className="player-box">小明<br/>已理牌</div>
        <div className="player-box">小红<br/>已理牌</div>
        <div className="player-box">小刚<br/>已理牌</div>
      </div>

      <div className="duns-container">
        <div className="dun-area">
          <div className="card-row">{renderCards(middleDun)}</div>
          <div className="dun-label">头道 (3)</div>
        </div>
        <div className="dun-area">
          <div className="card-row">{renderCards(frontDun)}</div>
          <div className="dun-label">中道 (5)</div>
        </div>
        <div className="dun-area">
          <div className="card-row">{renderCards(backDun)}</div>
          <div className="dun-label">后道 (5)</div>
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