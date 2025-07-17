import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Lobby from './pages/Lobby';
import ThirteenWater from './pages/ThirteenWater';
import DouDiZhu from './pages/DouDiZhu';
import BigTwo from './pages/BigTwo';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Lobby />} />
          <Route path="/thirteen-water" element={<ThirteenWater />} />
          <Route path="/doudizhu" element={<DouDiZhu />} />
          <Route path="/big-two" element={<BigTwo />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
