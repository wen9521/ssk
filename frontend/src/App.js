// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { GameProvider, useGame } from './context/GameContext';
import './App.css';

// 引入所有页面和游戏桌组件
import HomePage from './components/HomePage';
import GameLobby from './components/GameLobby';
import CardTable from './components/CardTable'; // This is likely for BigTwo
import DoudizhuTable from './components/DoudizhuTable';
import SpotTheDifference from './components/SpotTheDifference';
import LocalGameHost from './components/LocalGameHost';
import TryPlay from './components/TryPlay'; // Our new Thirteen Water component

function App() {
    return (
        <Router>
            <GameProvider>
                <div className="AppContainer">
                    <AppRoutes />
                </div>
            </GameProvider>
        </Router>
    );
}

function AppRoutes() {
    const { gameType, roomId } = useGame();

    const getGameTableElement = () => {
        if (!roomId) {
            return <Navigate to="/lobby" />;
        }
        
        switch (gameType) {
            case 'doudizhu':
                return <DoudizhuTable />;
            case 'big_two':
                return <CardTable />;
            // The 'thirteen_water' case for online play has been removed to prevent build errors,
            // as the corresponding component was deleted.
            default:
                return <Navigate to="/lobby" />;
        }
    };

    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/lobby" element={roomId ? <GameLobby /> : <Navigate to="/" />} />
            <Route path="/play" element={getGameTableElement()} />
            <Route path="/play-local/thirteen_water" element={<TryPlay />} />
            <Route path="/play-local/:gameType" element={<LocalGameHost />} />
            <Route path="/spot-the-difference" element={<SpotTheDifference />} />
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
}

export default App;
