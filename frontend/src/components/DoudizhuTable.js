// frontend/src/components/DoudizhuTable.js
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext'; // Import useGame
import Hand from './Hand';
import Opponent from './Opponent';
import Card from './Card';
import * as api from '../services/apiService'; 
import webSocketService from '../services/websocketService';
import './styles/GameTable.css';

const DoudizhuTable = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // 从 GameContext 获取状态和函数
    const {
        userId,
 roomId,
        players,
 roomStatus,
 doudizhuState,
 hand,
 refreshRoomStatus,
 handleBid,
 handlePlayCard,
        error,
    } = useGame();

    useEffect(() => {
        if (!roomId) { 
            navigate('/');
            return;
        }

        const handleWebSocketMessage = () => {
            refreshRoomStatus();
        };
        webSocketService.addMessageListener(handleWebSocketMessage);

        refreshRoomStatus();

        return () => {
            webSocketService.removeMessageListener(handleWebSocketMessage);
        };
    }, [roomId, navigate, refreshRoomStatus]);

    const renderBiddingControls = () => {
        if (roomStatus === 'bidding' && doudizhuState.biddingState?.currentBidderId === userId) {
            return (
                <div className="game-controls">
                    <button onClick={() => handleBid(1)}>1分</button>
                    <button onClick={() => handleBid(2)}>2分</button>
                    <button onClick={() => handleBid(3)}>3分</button>
                    <button onClick={() => handleBid(0)}>不叫</button>
                </div>
            );
        }
        return null;
    };

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
                            isLandlord={doudizhuState.landlord === p.user_id}
                        />
                    ))}
                </div>

                <div className="main-area">
                    {roomStatus === 'playing' && doudizhuState.landlordCards && doudizhuState.landlordCards.length > 0 && (
                        <div className="landlord-cards-display">
                            {doudizhuState.landlordCards.map(card => <Card key={card} cardName={card} />)}
                        </div>
                    )}
                    <div className="play-area">
                        {/* TODO: Need 'lastPlay' state from GameContext for this to work */}
                        {/* {doudizhuState.lastPlay && doudizhuState.lastPlay.cards.map(card => <Card key={card} cardName={card} />)} */}
                    </div>
                </div>

                <div className="player-seat-area">
                    {me && <Hand initialCards={hand || []} onPlay={handlePlayCard} />}
                </div>
            </div>

            {renderBiddingControls()}

            {error && <p className="error-message">{error}</p>}
            <button onClick={() => navigate('/')} className="exit-button">返回大厅</button>
        </div>
    );
};

export default DoudizhuTable;
