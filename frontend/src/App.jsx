// src/App.jsx
import React from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { DoudizhuPlay, ThirteenWaterPlay } from './components';
import './App.css';

const Home = () => (
  <div className="home-container">
    <h1 className="home-title">棋牌游戏中心</h1>
    <div className="game-links">
      <Link to="/thirteen-water" className="game-link">十三水</Link>
      <Link to="/doudizhu" className="game-link">斗地主</Link>
    </div>
  </div>
);

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/thirteen-water" element={<ThirteenWaterPlay />} />
        <Route path="/doudizhu" element={<DoudizhuPlay />} />
      </Routes>
    </Router>
  );
}
