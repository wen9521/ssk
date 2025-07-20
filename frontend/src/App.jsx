import React, { useState } from 'react';
import GameBoard from './components/GameBoard.jsx';

// 用于未来扩展八张游戏
function EightCardsComingSoon() {
  return (
    <div className="app">
      <h2>八张游戏</h2>
      <p>敬请期待！</p>
      <button className="btn" onClick={() => window.location.reload()}>返回首页</button>
    </div>
  );
}

// 十三水子菜单（试玩、自动匹配、房间列表）
function ThirteenWaterMenu({ onBack, onSelectMode }) {
  return (
    <div className="app">
      <h2>十三水</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, margin: '40px 0 20px 0' }}>
        <button className="btn" onClick={() => onSelectMode('offline')}>试玩（离线）</button>
        <button className="btn" onClick={() => onSelectMode('auto')}>自动匹配</button>
        <button className="btn" onClick={() => onSelectMode('rooms')}>房间列表</button>
      </div>
      <button className="btn" onClick={onBack} style={{ marginTop: 32 }}>返回首页</button>
    </div>
  );
}

export default function App() {
  const [mainMenu, setMainMenu] = useState(null); // 'thirteen', 'eight'
  const [thirteenMode, setThirteenMode] = useState(null); // 'offline', 'auto', 'rooms'

  // 首页
  if (!mainMenu) {
    return (
      <div className="app">
        <h1>扑克王</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22, marginTop: 60 }}>
          <button className="btn" onClick={() => setMainMenu('thirteen')}>十三水</button>
          <button className="btn" onClick={() => setMainMenu('eight')}>八张</button>
        </div>
      </div>
    );
  }

  // 八张游戏
  if (mainMenu === 'eight') {
    return <EightCardsComingSoon />;
  }

  // 十三水游戏
  if (mainMenu === 'thirteen' && !thirteenMode) {
    return (
      <ThirteenWaterMenu
        onBack={() => setMainMenu(null)}
        onSelectMode={setThirteenMode}
      />
    );
  }

  // 十三水 - 试玩模式（离线）
  if (mainMenu === 'thirteen' && thirteenMode === 'offline') {
    return (
      <div className="app">
        <h2>十三水试玩（离线）</h2>
        <GameBoard offlineMode={true} />
        <button className="btn" onClick={() => setThirteenMode(null)} style={{ marginTop: 32 }}>返回</button>
      </div>
    );
  }

  // 十三水 - 自动匹配/房间列表（预留，后续完善）
  if (mainMenu === 'thirteen' && (thirteenMode === 'auto' || thirteenMode === 'rooms')) {
    return (
      <div className="app">
        <h2>{thirteenMode === 'auto' ? '自动匹配' : '房间列表'}</h2>
        <p>功能开发中，敬请期待！</p>
        <button className="btn" onClick={() => setThirteenMode(null)} style={{ marginTop: 32 }}>返回</button>
      </div>
    );
  }

  // fallback
  return <div className="app"><h1>加载中...</h1></div>;
}
