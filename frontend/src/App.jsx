// src/App.jsx
import React from 'react';
import { HashRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Play from './components/Play';
import DoudizhuPlay from './components/doudizhu/DoudizhuPlay';
import './App.css';

// 游戏大厅（首页），包含三个游戏
function Lobby() {
  return (
    <div className="app-container lobby-container">
      <h1>指挥中心</h1>
      <div className="game-section thirteen-cards-section">
        <h2>十三张战役</h2>
        <Link to="/thirteen-cards-menu" className="btn btn-primary">部署部队</Link>
      </div>
      <div className="game-section doudizhu-section">
        <h2>斗地主对决</h2>
        <Link to="/doudizhu" className="btn btn-action">进入战场</Link>
      </div>
      <div className="game-section eight-cards-section">
        <h2>八张突袭</h2>
        <Link to="/coming-soon" className="btn btn-secondary">情报收集中</Link>
      </div>
    </div>
  );
}

// 敬请期待页面
function ComingSoon({ gameName }) {
  const navigate = useNavigate();
  return (
    <div className="app-container">
      <h2>任务锁定</h2>
      <p>新的战斗模式正在解锁中...</p>
      <button className="btn btn-secondary" onClick={() => navigate(-1)}>返回指挥中心</button>
    </div>
  );
}

// 十三张子菜单
function ThirteenCardsMenu() {
  const navigate = useNavigate();
  return (
    <div className="app-container">
      <h2>战役模式选择</h2>
      <div className="menu">
        <Link to="/play" className="btn btn-primary">离线模拟战</Link>
        <Link to="/coming-soon" className="btn btn-secondary">全球战网</Link>
        <Link to="/coming-soon" className="btn btn-secondary">加密通讯</Link>
      </div>
      <br/>
      <button className="btn btn-secondary" onClick={() => navigate('/')}>返回</button>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/thirteen-cards-menu" element={<ThirteenCardsMenu />} />
        <Route path="/play" element={<Play />} />
        <Route path="/doudizhu" element={<DoudizhuPlay />} /> 
        <Route path="/coming-soon" element={<ComingSoon gameName="此模块"/>} />
      </Routes>
    </HashRouter>
  );
}