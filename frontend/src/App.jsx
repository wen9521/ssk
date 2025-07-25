// frontend/src/App.jsx

import React from 'react';
import { HashRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Play from './components/Play'; 
import './App.css';

// 游戏大厅（首页）- 赛博坦指挥中心
function Lobby() {
  return (
    <div className="app-container lobby-container">
      <h1>CYBERTRON COMMAND</h1>
      <div className="game-section thirteen-cards-section">
        <h2>十三张战役</h2>
        <Link to="/thirteen-cards-menu" className="btn btn-primary">进入战场</Link>
      </div>
      <div className="game-section eight-cards-section">
        <h2>八张突袭</h2>
        <Link to="/coming-soon" className="btn">即将部署</Link>
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
      <p>新的战斗模式正在研发中！</p>
      <button className="btn btn-secondary" onClick={() => navigate(-1)}>返回指挥中心</button>
    </div>
  );
}

// 十三张子菜单 - 战役模式选择
function ThirteenCardsMenu() {
  const navigate = useNavigate();
  return (
    <div className="app-container">
      <h2>十三张战役</h2>
      <div className="menu">
        <Link to="/play" className="btn">开始战役 (离线模拟)</Link>
        <Link to="/coming-soon" className="btn">全球战网匹配</Link>
        <Link to="/coming-soon" className="btn">创建加密通讯</Link>
      </div>
      <br/>
      <button className="btn btn-secondary" onClick={() => navigate('/')}>返回首页</button>
    </div>
  );
}

// 八张子菜单
function EightCardsMenu() {
  const navigate = useNavigate();
  return (
    <div className="app-container">
      <h2>八张突袭</h2>
      <div className="menu">
        <Link to="/coming-soon" className="btn">开始游戏</Link>
        <Link to="/coming-soon" className="btn">在线匹配</Link>
        <Link to="/coming-soon" className="btn">创建房间</Link>
      </div>
      <br/>
      <button className="btn btn-secondary" onClick={() => navigate('/')}>返回首页</button>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/thirteen-cards-menu" element={<ThirteenCardsMenu />} />
        <Route path="/eight-cards-menu" element={<EightCardsMenu />} />
        <Route path="/play" element={<Play />} />
        <Route path="/coming-soon" element={<ComingSoon gameName="此游戏"/>} />
      </Routes>
    </HashRouter>
  );
}
