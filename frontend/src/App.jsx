import React from 'react';
import { HashRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Game from './components/Game';
import './App.css';

// 游戏大厅（首页）
function Lobby() {
  return (
    <div className="app-container">
      <h1>扑克王</h1>
      <div className="menu">
        <Link to="/thirteen-menu" className="btn">十三水</Link>
        <Link to="/coming-soon" className="btn">德州扑克</Link>
        <Link to="/coming-soon" className="btn">斗地主</Link>
      </div>
    </div>
  );
}

// 敬请期待页面
function ComingSoon() {
  const navigate = useNavigate();
  return (
    <div className="app-container coming-soon">
      <h2>敬请期待</h2>
      <p>更多精彩游戏正在路上！</p>
      <button className="btn btn-secondary" onClick={() => navigate(-1)}>返回</button>
    </div>
  );
}

// 十三水子菜单
function ThirteenWaterMenu() {
  const navigate = useNavigate();
  return (
    <div className="app-container">
      <h2>十三水</h2>
      <div className="menu">
        <Link to="/play" className="btn">开始游戏 (离线模式)</Link>
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
        <Route path="/thirteen-menu" element={<ThirteenWaterMenu />} />
        <Route path="/play" element={<Game />} />
        <Route path="/coming-soon" element={<ComingSoon />} />
      </Routes>
    </HashRouter>
  );
}
