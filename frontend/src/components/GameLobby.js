// frontend/src/components/GameLobby.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';

function GameLobby() {
    const { 
        roomId, 
        players, 
        isCreator, 
        roomStatus,
        isLoading, 
        error, 
        handleStartGame,
        lastWsMessage
    } = useGame();
    
    const navigate = useNavigate();

    // 当房间状态变为 'playing' 时，自动跳转到游戏桌页面
    useEffect(() => {
        if (roomStatus === 'playing') {
            navigate('/play');
        }
    }, [roomStatus, navigate]);

    return (
        <div style={{ padding: '20px' }}>
            <h2>游戏大厅</h2>
            <p>房间ID: <strong>{roomId}</strong> (分享给你的朋友!)</p>
            <p>状态: {isLoading ? '加载中...' : roomStatus}</p>

            {error && <p style={{ color: 'red' }}>错误: {error}</p>}
            
            <h3>玩家列表 ({players.length}/4)</h3>
            <ul>
                {players.map(p => (
                    <li key={p.user_id}>
                        {p.user_id} {p.is_creator ? '(房主)' : ''}
                    </li>
                ))}
            </ul>

            {isCreator && (
                <button 
                    onClick={handleStartGame} 
                    disabled={isLoading || players.length !== 4 || roomStatus !== 'full'}
                >
                    {players.length !== 4 ? `等待玩家... (${players.length}/4)` : '开始游戏'}
                </button>
            )}
            
            {!isCreator && <p>请等待房主开始游戏...</p>}

            <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '10px' }}>
                <h4>实时消息日志:</h4>
                <p>{lastWsMessage ? JSON.stringify(lastWsMessage) : '等待消息...'}</p>
            </div>
        </div>
    );
}

export default GameLobby;
