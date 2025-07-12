// frontend/src/components/RoomActions.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import './styles/RoomActions.css'; // 引入专属CSS

function RoomActions() {
    const { 
        gameType, 
        handleCreateRoom, 
        handleJoinRoom, 
        isLoading, 
        error,
        goBackToGameSelection 
    } = useGame();

    const [joinRoomId, setJoinRoomId] = useState('');
    const navigate = useNavigate();

    const onCreate = async () => {
        const success = await handleCreateRoom();
        if (success) navigate('/lobby');
    };

    const onJoin = async (e) => {
        e.preventDefault();
        if (!joinRoomId) return;
        const success = await handleJoinRoom(joinRoomId);
        if (success) navigate('/lobby');
    };
    
    const getGameName = (type) => {
        const gameMap = {
            'thirteen_water': '十三水', 'doudizhu': '斗地主', 'big_two': '锄大地'
        };
        return gameMap[type] || '未知游戏';
    }

    return (
        <div className="actions-container glass-card">
            <button onClick={goBackToGameSelection} className="back-button">&larr;</button>
            <h2 className="actions-header">{getGameName(gameType)}</h2>

            {error && <p className="error-message">{error}</p>}
            
            <button onClick={onCreate} disabled={isLoading}>
                {isLoading ? '正在创建...' : '创建新房间'}
            </button>

            <form onSubmit={onJoin} className="actions-form">
                <input
                    type="text"
                    placeholder="或输入房间ID加入"
                    value={joinRoomId}
                    onChange={(e) => setJoinRoomId(e.target.value)}
                    disabled={isLoading}
                />
                <button type="submit" disabled={isLoading || !joinRoomId}>
                    {isLoading ? '正在加入...' : '加入房间'}
                </button>
            </form>
        </div>
    );
}

export default RoomActions;
