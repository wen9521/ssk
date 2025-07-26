// src/pages/lobby/Lobby.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import './Lobby.css'; // 我们将为大厅创建新的样式

const games = [
  { name: '十三水', path: '/thirteen-water', description: '策略与运气的博弈' },
  { name: '斗地主', path: '/doudizhu', description: '地主与农民的战争' },
  { name: '八张', path: '/eight-cards', description: '（待开发）' },
  { name: '锄大地', path: '/big-two', description: '（待开发）' },
];

const Lobby = () => {
  return (
    <div className="lobby-container">
      <h1 className="home-title">游戏大厅</h1>
      <div className="game-links">
        {games.map((game) => (
          <Link to={game.path} key={game.name} className="game-link">
            <div className={`game-section ${game.path.slice(1)}-section`}>
              <h2>{game.name}</h2>
              <p className="game-description">{game.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Lobby;
