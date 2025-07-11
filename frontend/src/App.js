import React from 'react';
import CardTable from './components/CardTable';

function App() {
  return (
    <div className="game-container">
      <header className="game-header">
        <h1>多人十三水</h1>
        <div className="game-stats">
          <span>玩家: 4人</span>
          <span>筹码: 1000</span>
        </div>
      </header>
      
      <main className="game-main">
        <CardTable />
      </main>
      
      <footer className="game-footer">
        <p>© 2025 十三水游戏 | 前端部署在 Cloudflare Pages</p>
      </footer>
    </div>
  );
}

export default App;