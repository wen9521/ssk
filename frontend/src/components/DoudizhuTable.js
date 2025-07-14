// frontend/src/components/DoudizhuTable.js
import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GameContext } from '../context/GameContext';
import Hand from './Hand';
import Opponent from './Opponent';
import Card from './Card';
import * as api from '../services/apiService';
import webSocketService from '../services/websocketService';
import './styles/GameTable.css';

const DoudizhuTable = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { gameState, setGameState, userId } = useContext(GameContext);

    // 游戏状态
    const [players, setPlayers] = useState([]);
    const [landlord, setLandlord] = useState(null);
    const [landlordCards, setLandlordCards] = useState([]);
    const [currentTurn, setCurrentTurn] = useState(null);
    const [lastPlay, setLastPlay] = useState(null);
    const [gamePhase, setGamePhase] = useState('loading'); // loading, bidding, playing, finished
    const [error, setError] = useState('');

    const roomId = location.state?.roomId || gameState.roomId;

    useEffect(() => {
        if (!roomId) {
            navigate('/');
            return;
        }
        // WebSocket消息监听器
        const handleWebSocketMessage = (message) => {
            // 在这里处理从服务器推送的实时游戏状态更新
            // 例如：有玩家出牌、轮到下一位玩家等
        };
        webSocketService.addMessageListener(handleWebSocketMessage);

        // 获取初始游戏状态
        const fetchGameStatus = async () => {
            try {
                const status = await api.getRoomStatus(roomId);
                // TODO: 根据 getRoomStatus 返回的数据来设置初始状态
                // setPlayers, setGamePhase, etc.
            } catch (err) {
                setError("无法获取游戏状态，请重试。");
            }
        };
        fetchGameStatus();

        return () => {
            webSocketService.removeMessageListener(handleWebSocketMessage);
        };
    }, [roomId, navigate]);

    // 叫分操作
    const handleBid = async (bidValue) => {
        try {
            await api.bid(roomId, userId, bidValue);
            // 成功后，等待WebSocket更新或主动刷新状态
        } catch (err) {
            setError(err.message);
        }
    };

    // 出牌操作
    const handlePlayCards = async (cards) => {
        try {
            await api.playCard(roomId, userId, cards);
            // 成功后，等待WebSocket更新或主动刷新状态
        } catch (err) {
            setError(err.message);
        }
    };

    const renderBiddingControls = () => (
        <div className="game-controls">
            <button onClick={() => handleBid(1)}>1分</button>
            <button onClick={() => handleBid(2)}>2分</button>
            <button onClick={() => handleBid(3)}>3分</button>
            <button onClick={() => handleBid(0)}>不叫</button>
        </div>
    );

    // 假设PlayerHand组件可以处理出牌逻辑并回调handlePlayCards
    const renderPlayingControls = () => (
        // PlayerHand 组件将包含自己的出牌和PASS按钮
        <div></div> 
    );

    const me = players.find(p => p.user_id === userId);
    const opponents = players.filter(p => p.user_id !== userId);

    return (
        <div className="game-table-container doudizhu-bg">
            <div className="game-table">
                <div className="opponent-seats">
                    {opponents.map(p => (
                        <Opponent 
                            key={p.user_id}
                            name={p.user_id} 
                            isReady={p.status !== 'joined'} 
                            // TODO: Add more props like card count, role, etc.
                        />
                    ))}
                </div>

                <div className="main-area">
                    <div className="landlord-cards-display">
                        {landlordCards.map(card => <Card key={card} cardName={card} />)}
                    </div>
                    <div className="play-area">
                        {lastPlay && lastPlay.cards.map(card => <Card key={card} cardName={card} />)}
                    </div>
                </div>

                <div className="player-seat-area">
                    {me && <Hand initialCards={me.hand || []} onPlay={handlePlayCards} />}
                </div>
            </div>

            {gamePhase === 'bidding' && currentTurn === userId && renderBiddingControls()}
            {error && <p className="error-message">{error}</p>}
            <button onClick={() => navigate('/')} className="exit-button">返回大厅</button>
        </div>
    );
};

export default DoudizhuTable;
