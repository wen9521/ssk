// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { GameProvider, useGame } from './context/GameContext';
import './App.css';

// 引入所有页面和游戏桌组件
import HomePage from './components/HomePage';
import GameLobby from './components/GameLobby';
import CardTable from './components/CardTable'; // This is likely for ThirteenWater/BigTwo
import DoudizhuTable from './components/DoudizhuTable'; // Import the new Doudizhu table
import ThirteenWater from './components/ThirteenWater'; // Import the ThirteenWater table
import SpotTheDifference from './components/SpotTheDifference';

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
                // For thirteen water, we use the ThirteenWater component
                return <ThirteenWater />;
            
            case 'doudizhu':
                // For Doudizhu, we now render the DoudizhuTable component
                return <DoudizhuTable />;
            
            case 'big_two':
                // Assuming Big Two might use a similar table to Thirteen Water for now
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
            {/* The /play route now uses the logic from our helper function */}
            <Route path="/play" element={getGameTableElement()} />
            <Route path="/spot-the-difference" element={<SpotTheDifference />} />
            {/* Catch-all route to redirect any unknown paths to the home page */}
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
}

export default App;
