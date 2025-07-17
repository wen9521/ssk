import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Lobby from './pages/Lobby';
import ThirteenWaterEntry from './pages/ThirteenWaterEntry'; // 新的十三水入口页
import Play from './pages/Play'; // 十三水实际游戏页
import DouDiZhu from './pages/DouDiZhu';
import BigTwo from './pages/BigTwo';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Lobby />} />
          <Route path="/thirteen-water" element={<ThirteenWaterEntry />} />
          <Route path="/thirteen-water/play" element={<Play />} />
          <Route path="/doudizhu" element={<DouDiZhu />} />
          <Route path="/big-two" element={<BigTwo />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
