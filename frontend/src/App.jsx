import React from 'react';
import GameBoard from './components/GameBoard.jsx';
import './App.css'; // 正确的相对路径

function App() {
  return (
    <div className="app">
      <h1>十三水游戏</h1>
      <GameBoard />
    </div>
  );
}

export default App;
