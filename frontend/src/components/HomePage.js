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
                <h1>在线棋牌游戏中心</h1>
                <p>由 WSS & Gewe 提供技术支持</p>
            </header>
            
            <main className="glass-card">
                { !gameType ? <GameSelector /> : <ModeSelector /> } {/* <-- 更新组件 */}
            </main>
        </div>
    );
}

export default HomePage;
