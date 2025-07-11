import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import GameLobby from './components/GameLobby';
import ThirteenWater from './components/ThirteenWater';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<GameLobby />} />
        <Route path="/thirteen-water" element={<ThirteenWater />} />
      </Routes>
    </Router>
  );
}

export default App;