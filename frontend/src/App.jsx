// frontend/src/App.jsx

import React from 'react';
import { HashRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Play from './components/Play'; 
import './App.css';

// 游戏大厅（首页）
function Lobby() {
  return (
    <div className="app-container lobby-container">
      {/* 移除了 H1 标题 */}
      <div className="game-section thirteen-cards-section">
        <h2>十三张</h2>
        <Link to="/thirteen-cards-menu" className="btn btn-primary">进入游戏</Link>
      </div>
      <div className="game-section eight-cards-section">
        <h2>八张</h2>
        <Link to="/coming-soon" className="btn">敬请期待</Link>
      </div>
    </div>
  );
}

// 敬请期待页面
function ComingSoon({ gameName }) {
  const navigate = useNavigate();
  return (
    <div className="app-container coming-soon">
      <h2>{gameName}</h2>
      <p>新游戏模式正在紧张开发中！</p>
      <button className="btn btn-secondary" onClick={() => navigate(-1)}>返回</button>
    </div>
  );
}

// 十三张子菜单
function ThirteenCardsMenu() {
  const navigate = useNavigate();
  return (
    <div className="app-container">
      <h2>十三张</h2>
      <div className="menu">
        <Link to="/play" className="btn btn-primary">开始游戏 (离线模式)</Link>
        <Link to="/coming-soon" className="btn btn-secondary">在线匹配</Link>
        <Link to="/coming-soon" className="btn btn-secondary">创建房间</Link>
      </div>
      <br/>
      <button className="btn btn-secondary" onClick={() => navigate('/')}>返回首页</button>
    </div>
  );
}

// ... (EightCardsMenu 组件保持原样)

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/thirteen-cards-menu" element={<ThirteenCardsMenu />} />
        {/* ... (其余路由保持原样) */}
        <Route path="/eight-cards-menu" element={<EightCardsMenu />} />
        <Route path="/play" element={<Play />} />
        <Route path="/coming-soon" element={<ComingSoon gameName="此游戏"/>} />
      </Routes>
    </HashRouter>
  );
}

function EightCardsMenu() {
  const navigate = useNavigate();
  return (
    <div className="app-container">
      <h2>八张</h2>
      <div className="menu">
        <Link to="/coming-soon" className="btn btn-primary">开始游戏</Link>
        <Link to="/coming-soon" className="btn btn-secondary">在线匹配</Link>
        <Link to="/coming-soon" className="btn btn-secondary">创建房间</Link>
      </div>
      <br/>
      <button className="btn btn-secondary" onClick={() => navigate('/')}>返回首页</button>
    </div>
  );
}
