import React from 'react';
import { Link } from 'react-router-dom';
import '../App.css';

function Lobby() {
  return (
    <div className="lobby">
      <h1>欢迎来到棋牌大厅</h1>
      <p className="lobby-intro">选择您想玩的游戏，立即加入牌局！</p>
      <div className="game-list">
        <Link to="/thirteen-water" className="game-card">
          <div className="game-icon">
            <img src="/cards/king_of_spades.svg" alt="十三水" />
          </div>
          <h2>十三水</h2>
          <p>考验牌型组合与策略</p>
        </Link>
        <Link to="/doudizhu" className="game-card">
          <div className="game-icon">
            <img src="/cards/red_joker.svg" alt="斗地主" />
          </div>
          <h2>斗地主</h2>
          <p>经典三人对抗，炸弹乐趣多</p>
        </Link>
        <Link to="/big-two" className="game-card">
          <div className="game-icon">
            <img src="/cards/2_of_spades.svg" alt="锄大地" />
          </div>
          <h2>锄大地</h2>
          <p>出牌技巧与团队配合</p>
        </Link>
      </div>
    </div>
  );
}

export default Lobby;
