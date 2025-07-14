// frontend/src/components/HomePage.js
import React from 'react';
import { useGame } from '../context/GameContext';
import GameSelector from './GameSelector';
import ModeSelector from './ModeSelector'; // <-- 更新引用

function HomePage() {
    const { gameType } = useGame();

    return (
        <div className="page-container">
            <header>
            </header>
            
            <main className="glass-card">
                { !gameType ? <GameSelector /> : <ModeSelector /> } {/* <-- 更新组件 */}
            </main>
        </div>
    );
}

export default HomePage;
