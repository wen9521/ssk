// src/App.jsx

import React from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
// 确保导入了十三水和斗地主的 Play 组件
import ThirteenWaterPlay from './components/thirteenWater/Play'; 
import DoudizhuPlay from './components/doudizhu/DoudizhuPlay';
import './App.css';

/**
 * 优化后的主页组件 (Home)
 * - 使用了 lobby-container 和 game-section 等样式
 * - 为每个游戏创建了独立的、更具视觉吸引力的卡片链接
 */
const Home = () => (
  <div className="lobby-container">
    <h1 className="home-title">赛博坦指挥中心</h1>
    <div className="game-links">
      
      {/* 十三水游戏卡片 */}
      <Link to="/thirteen-water" className="game-link">
        <div className="game-section thirteen-cards-section">
          <h2>十三水</h2>
          <p className="game-description">汽车人战术部署，策略与运气的博弈</p>
        </div>
      </Link>

      {/* 斗地主游戏卡片 */}
      <Link to="/doudizhu" className="game-link">
        <div className="game-section doudizhu-section">
          <h2>斗地主</h2>
          <p className="game-description">霸天虎强势对决，地主与农民的战争</p>
        </div>
      </Link>
      
    </div>
  </div>
);

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* 确保路由路径和组件名称正确 */}
        <Route path="/thirteen-water" element={<ThirteenWaterPlay />} />
        <Route path="/doudizhu" element={<DoudizhuPlay />} />
      </Routes>
    </Router>
  );
}