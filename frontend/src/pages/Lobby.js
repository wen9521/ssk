import React from 'react';
import { Link } from 'react-router-dom';

function Lobby() {
  return (
    <div className="lobby">
      <h1>游戏大厅</h1>
      <div className="game-list">
        <Link to="/thirteen-water" className="game-card">
          <h2>十三水</h2>
          <p>经典福建扑克游戏</p>
        </Link>
        <Link to="/doudizhu" className="game-card">
          <h2>斗地主</h2>
          <p>三人对战，乐趣无穷</p>
        </Link>
        <Link to="/big-two" className="game-card">
          <h2>锄大地</h2>
          <p>港式经典，步步为营</p>
        </Link>
      </div>
    </div>
  );
}

export default Lobby;
