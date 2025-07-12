// frontend/src/components/HomePage.js
import React, 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import GameSelector from './GameSelector'; // 将创建这个新组件
import RoomActions from './RoomActions'; // 将创建这个新组件

function HomePage() {
    const { gameType } = useGame(); // 从Context中获取当前选择的游戏类型

    return (
        <div style={{ padding: '20px', textAlign: 'center', maxWidth: '500px', margin: 'auto' }}>
            <header style={{ marginBottom: '40px' }}>
                <h1>在线棋牌游戏中心</h1>
            </header>
            
            <main>
                {/* 如果尚未选择游戏类型，则显示游戏选择器；否则显示房间操作 */}
                { !gameType ? <GameSelector /> : <RoomActions /> }
            </main>
        </div>
    );
}

export default HomePage;
