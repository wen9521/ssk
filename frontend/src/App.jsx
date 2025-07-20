import React from 'react';
import GameBoard from './components/GameBoard.jsx';
import '/frontend/src/App.css'; // 导入 CSS 文件

function App() {
  return (
    <div className="app">
      <h1>十三水游戏</h1>
      <GameBoard />
    </div>
  );
}

export default App;
