// frontend/src/components/LocalGameHost.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DoudizhuTable from './DoudizhuTable';
import TryPlay from './TryPlay'; // 修正：将导入从 ThirteenWater 改为 TryPlay
import CardTable from './CardTable'; // For Big Two
import * as gameLogic from '../gameLogic/gameManager';

function LocalGameHost() {
    const { gameType } = useParams();
    const navigate = useNavigate();
    const [gameState, setGameState] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        try {
            const initialState = gameLogic.initializeGame(gameType);
            setGameState(initialState);
        } catch (e) {
            console.error(e);
            setError(`无法初始化游戏: ${e.message}`);
        }
    }, [gameType]);

    const handleGameAction = (action) => {
        try {
            const newState = gameLogic.handleAction(gameState, action);
            setGameState(newState);
            
            // 如果游戏结束，可以处理一些逻辑
            if(newState.gameover) {
                console.log("游戏结束!", newState.winner, "胜利!");
            }
        } catch (e) {
            console.error(e);
            setError(`操作失败: ${e.message}`);
        }
    };
    
    const handleReturnToLobby = () => {
        navigate('/lobby');
    };

    if (error) {
        return (
            <div className="game-error">
                <h2>发生错误</h2>
                <p>{error}</p>
                <button onClick={handleReturnToLobby}>返回大厅</button>
            </div>
        );
    }
    
    if (!gameState) {
        return <div className="loading-spinner"></div>;
    }

    // 将整个游戏状态和操作函数传递给游戏桌
    const gameProps = {
        ...gameState,
        onPlay: (cards) => handleGameAction({ type: 'PLAY', payload: cards }),
        onPass: () => handleGameAction({ type: 'PASS' }),
        onBid: (amount) => handleGameAction({ type: 'BID', payload: amount }), // For Doudizhu
        onSetDun: (arrangement) => handleGameAction({ type: 'SET_DUN', payload: arrangement }), // For Thirteen Water
        isLocal: true, // 标志位，告知组件这是本地游戏
        handleReturn: handleReturnToLobby,
    };
    
    switch (gameType) {
        case 'doudizhu':
            return <DoudizhuTable {...gameProps} />;
        case 'thirteen_water':
            return <TryPlay {...gameProps} />; // 修正：渲染的组件从 ThirteenWater 改为 TryPlay
        case 'big_two':
            return <CardTable {...gameProps} />;
        default:
            setError("未知的游戏类型");
            return null;
    }
}

export default LocalGameHost;
