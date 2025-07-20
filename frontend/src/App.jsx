import React from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import GameBoard from './components/GameBoard.jsx';
import './App.css'; // 确保App.css被引入

// 游戏大厅（首页）
function Lobby() {
  return (
    <div className="app">
      <h1>扑克王</h1>
      <div className="menu">
        <Link to="/thirteen" className="btn">十三水</Link>
        <Link to="/eight" className="btn">八张</Link>
      </div>
    </div>
  );
}

// 敬请期待页面
function ComingSoon({ gameName }) {
  const navigate = useNavigate();
  return (
    <div className="app">
      <h2>{gameName}</h2>
      <p>敬请期待！</p>
      <button className="btn" onClick={() => navigate(-1)}>返回</button>
    </div>
  );
}

// 十三水子菜单
function ThirteenWaterMenu() {
  return (
    <div className="app">
      <h2>十三水</h2>
      <div className="menu">
        {/* Play.jsx 现在是 GameBoard.jsx 的父组件，处理路由和返回逻辑 */}
        <Link to="/play" className="btn">试玩（离线）</Link>
        <Link to="/thirteen/auto" className="btn">自动匹配</Link>
        <Link to="/thirteen/rooms" className="btn">房间列表</Link>
      </div>
      <Link to="/" className="btn btn-back">返回首页</Link>
    </div>
  );
}

// 专门用于承载游戏板的组件，处理返回逻辑
function Play() {
    const navigate = useNavigate();
    return (
        <div className="app">
             {/* GameBoard 不再需要 navigate, 因为它的父组件处理了 */}
            <GameBoard />
            <button className="btn btn-back" onClick={() => navigate(-1)}>返回菜单</button>
        </div>
    );
}


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/thirteen" element={<ThirteenWaterMenu />} />
        <Route path="/eight" element={<ComingSoon gameName="八张" />} />
        <Route path="/thirteen/auto" element={<ComingSoon gameName="自动匹配" />} />
        <Route path="/thirteen/rooms" element={<ComingSoon gameName="房间列表" />} />
        <Route path="/play" element={<Play />} />
      </Routes>
    </BrowserRouter>
  );
}
