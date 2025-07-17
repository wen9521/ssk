import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Lobby from './pages/Lobby';
import ThirteenWaterEntry from './pages/ThirteenWaterEntry';
import ThirteenWaterPlay from './pages/ThirteenWaterPlay';
import DouDiZhuEntry from './pages/DouDiZhuEntry'; 
import DouDiZhuPlay from './pages/DouDiZhuPlay';
import BigTwoEntry from './pages/BigTwoEntry'; 
import BigTwoPlay from './pages/BigTwoPlay'; 
import ThirteenWater from './pages/ThirteenWater';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Lobby />} />
          <Route path="/thirteen-water" element={<ThirteenWater />} />
          <Route path="/thirteen-water/entry" element={<ThirteenWaterEntry />} />
          <Route path="/thirteen-water/play" element={<ThirteenWaterPlay />} />
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
