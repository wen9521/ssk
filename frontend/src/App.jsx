// src/App.jsx

import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// 导入游戏大厅
import Lobby from './pages/lobby/Lobby';

// 导入各个游戏的主组件
import DoudizhuPlay from './games/doudizhu/ui/DoudizhuPlay';
import ThirteenWaterPlay from './games/thirteenWater/ui/Play';
import EightCardsPlay from './games/eightCards/ui/EightCardsPlay';
import BigTwoPlay from './games/bigTwo/ui/BigTwoPlay';

import './App.css';

export default function App() {
  return (
    <DndProvider backend={HTML5Backend}>
      <Router>
        <Routes>
          <Route path="/" element={<Lobby />} />
          <Route path="/doudizhu" element={<DoudizhuPlay />} />
          <Route path="/thirteen-water" element={<ThirteenWaterPlay />} />
          <Route path="/eight-cards" element={<EightCardsPlay />} />
          <Route path="/big-two" element={<BigTwoPlay />} />
        </Routes>
      </Router>
    </DndProvider>
  );
}
