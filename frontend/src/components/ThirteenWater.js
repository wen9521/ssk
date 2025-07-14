// frontend/src/components/ThirteenWater.js
import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GameContext } from '../context/GameContext';
import SmartSplit from './SmartSplit';
import Opponent from './Opponent';
import './styles/GameTable.css';

const ThirteenWater = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { gameState, setGameState } = useContext(GameContext);

    // 游戏阶段: 'dealing', 'splitting', 'comparing', 'finished'
    const [phase, setPhase] = useState('dealing'); 
    const [hand, setHand] = useState([]);
    const [otherPlayersStatus, setOtherPlayersStatus] = useState({});
    
    // 从路由状态获取房间信息，或从全局状态获取
    const roomId = location.state?.roomId || gameState.roomId;

    useEffect(() => {
        if (!roomId) {
            console.error("没有房间ID，正在返回首页...");
            navigate('/');
            return;
        }

        // 初始化或刷新游戏状态
        // 在真实应用中，这里会调用 getRoomStatus(roomId)
        const mockHand = ["ace_of_spades", "king_of_spades", "queen_of_spades", "jack_of_spades", "10_of_spades", "2_of_hearts", "3_of_diamonds", "4_of_clubs", "5_of_hearts", "6_of_diamonds", "7_of_clubs", "8_of_hearts", "9_of_diamonds"];
        setHand(mockHand);
        setPhase('splitting'); // 假设已从后端拿到牌，进入理牌阶段

        // 模拟其他玩家的状态
        setOtherPlayersStatus({
            'ai_player_1': { name: '小红', isReady: false },
            'ai_player_2': { name: '小明', isReady: false },
            'ai_player_3': { name: '小刚', isReady: false },
        });

    }, [roomId, navigate, gameState.roomId]);

    // 当本地玩家完成理牌时的回调
    const handleDunSet = () => {
        // 更新UI，显示"已准备"
        // 在真实应用中，可以发送一个WebSocket消息通知其他人
        console.log("您已完成理牌，等待其他玩家...");
        setPhase('comparing'); // 暂时直接进入比牌阶段
    };

    const renderGameContent = () => {
        switch (phase) {
            case 'dealing':
                return <div className="game-phase-message">正在发牌...</div>;
            case 'splitting':
                return (
                    <SmartSplit 
                        playerHand={hand} 
                        roomId={roomId} 
                        userId={gameState.userId} // 假设userId在GameContext中
                        onDunSet={handleDunSet} 
                    />
                );
            case 'comparing':
                return <div className="game-phase-message">等待其他玩家理牌...</div>;
            case 'finished':
                 // TODO: 在此渲染比牌结果和得分
                return <div className="game-phase-message">游戏结束</div>;
            default:
                return <div className="game-phase-message">正在加载游戏...</div>;
        }
    };

    return (
        <div className="game-table-container thirteen-water-bg">
            <div className="game-table">
                <div className="opponent-seats">
                    {Object.entries(otherPlayersStatus).map(([id, player]) => (
                        <Opponent 
                            key={id} 
                            name={player.name} 
                            isReady={player.isReady} 
                        />
                    ))}
                </div>

                <div className="main-area">
                    {renderGameContent()}
                </div>

                <div className="player-seat-area">
                    {/* 可以放置玩家信息或手牌概要 */}
                </div>
            </div>
            <button onClick={() => navigate('/')} className="exit-button">返回大厅</button>
        </div>
    );
};

export default ThirteenWater;
