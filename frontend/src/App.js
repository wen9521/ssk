import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Lobby from './pages/Lobby';
import ThirteenWaterEntry from './pages/ThirteenWaterEntry';
import Play from './pages/Play';
import DouDiZhuEntry from './pages/DouDiZhuEntry'; // 斗地主入口页
import DouDiZhuPlay from './pages/DouDiZhuPlay'; // 斗地主游戏页 (占位)
import BigTwoEntry from './pages/BigTwoEntry'; // 锄大地入口页
import BigTwoPlay from './pages/BigTwoPlay'; // 锄大地游戏页 (占位)

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Lobby />} />
          <Route path="/thirteen-water" element={<ThirteenWaterEntry />} />
          <Route path="/thirteen-water/play" element={<Play />} />
          <Route path="/doudizhu" element={<DouDiZhuEntry />} />
          <Route path="/doudizhu/play" element={<DouDiZhuPlay />} />
          <Route path="/big-two" element={<BigTwoEntry />} />
          <Route path="/big-two/play" element={<BigTwoPlay />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
