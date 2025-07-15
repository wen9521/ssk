// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { GameProvider, useGame } from './context/GameContext';
import './App.css';

// 引入所有页面和游戏桌组件
import HomePage from './components/HomePage';
import GameLobby from './components/GameLobby';
import CardTable from './components/CardTable'; // This is likely for ThirteenWater/BigTwo
import DoudizhuTable from './components/DoudizhuTable';
import ThirteenWater from './components/ThirteenWater';
import SpotTheDifference from './components/SpotTheDifference';
import LocalGameHost from './components/LocalGameHost'; // 引入新的本地游戏组件

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

    // A helper function to determine which game table to render
    const getGameTableElement = () => {
        if (!roomId) {
            // If there's no room ID, the user shouldn't be on the play page.
            return <Navigate to="/lobby" />;
        }
        
        // Render the correct game table based on the gameType from context
        switch (gameType) {
            case 'thirteen_water':
                return <ThirteenWater />;
            
            case 'doudizhu':
                return <DoudizhuTable />;
            
            case 'big_two':
                return <CardTable />;
            
            default:
                // If gameType is unknown, redirect
                return <Navigate to="/lobby" />;
        }
    };

    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/lobby" element={roomId ? <GameLobby /> : <Navigate to="/" />} />
            <Route path="/play" element={getGameTableElement()} />
            <Route path="/play-local/:gameType" element={<LocalGameHost />} /> {/* 新增的本地游戏路由 */}
            <Route path="/spot-the-difference" element={<SpotTheDifference />} />
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
}

export default App;
