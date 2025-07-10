import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MobileGameTable from './components/game/MobileGameTable';
import Lobby from './components/game/Lobby';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/game" element={<MobileGameTable />} />
      </Routes>
    </Router>
  );
}

export default App;