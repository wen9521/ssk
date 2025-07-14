// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { GameProvider, useGame } from './context/GameContext';
import './App.css';

// 引入所有页面和游戏桌组件
import HomePage from './components/HomePage';
import GameLobby from './components/GameLobby';
import CardTable from './components/CardTable';
import DoudizhuTable from './components/DoudizhuTable';
import SpotTheDifference from './components/SpotTheDifference';

function App() {
    return (
        <Router> {/* <-- Router 现在包裹了 GameProvider */}
            <GameProvider>
                <div className="AppContainer">
                    <AppRoutes />
                </div>
            </GameProvider>
        </Router>
    );
}

// 路由组件保持不变
function AppRoutes() {
    const { gameType, roomId, roomStatus } = useGame();

    const getGameTableElement = () => {
        if (!roomId) return <Navigate to="/lobby" />;
        
        switch (gameType) {
            case 'thirteen_water':
            case 'big_two':
                return (roomStatus === 'playing' || roomStatus === 'scoring' || roomStatus === 'finished') ? <CardTable /> : <Navigate to="/lobby" />;
            
            case 'doudizhu':
                return (roomStatus === 'bidding' || roomStatus === 'playing' || roomStatus === 'finished') ? <DoudizhuTable /> : <Navigate to="/lobby" />;
            
            default:
                return <Navigate to="/lobby" />;
        }
    };

    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/lobby" element={roomId ? <GameLobby /> : <Navigate to="/" />} />
            <Route path="/play" element={getGameTableElement()} />
            <Route path="/spot-the-difference" element={<SpotTheDifference />} />
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
}

export default App;
