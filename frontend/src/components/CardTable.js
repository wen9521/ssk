// frontend/src/components/CardTable.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import Hand from './Hand';
import Opponent from './Opponent';
import Card from './Card';
import webSocketService from '../services/websocketService';
import './styles/GameTable.css';
import './styles/GameControls.css';

// This component is now for Big Two
const CardTable = (props) => {
    const isLocal = props.isLocal || false;
    
    const contextData = useGame();
    const navigate = useNavigate();

    // --- State Derivation ---
    const players = isLocal ? props.players : contextData.players || [];
    const userId = isLocal ? 0 : contextData.userId;
    const hand = isLocal ? props.players.find(p => p.id === 0)?.hand : contextData.hand;
    const gamePhase = isLocal ? props.gamePhase : contextData.roomStatus;
    const currentPlayerId = isLocal ? props.currentPlayer : contextData.bigTwoState?.currentPlayerId;
    const lastPlayedHand = isLocal ? props.lastPlayedHand : contextData.bigTwoState?.lastPlayedHand;
    
    // --- Actions ---
    const handlePlayCard = isLocal ? (selectedCards) => props.onPlay(selectedCards) : contextData.handlePlayCard;
    const handlePass = isLocal ? props.onPass : () => contextData.handlePlayCard([]);
    const handleReturn = isLocal ? props.handleReturn : () => navigate('/lobby');
    
    // --- Local state for card selection ---
    const [selectedCards, setSelectedCards] = useState([]);

    // --- Effects for Online Mode ---
    useEffect(() => {
        if (isLocal || !contextData.roomId) return;
        const handleWebSocketMessage = () => contextData.refreshRoomStatus();
        webSocketService.addMessageListener(handleWebSocketMessage);
        contextData.refreshRoomStatus();
        return () => webSocketService.removeMessageListener(handleWebSocketMessage);
    }, [isLocal, contextData.roomId, contextData.refreshRoomStatus, contextData]);


    // --- UI Rendering ---
    const renderPlayingControls = () => {
        if (gamePhase === 'playing' && currentPlayerId === userId) {
            // First turn D3 rule for local play
            if (isLocal && !props.lastPlayedHand && !selectedCards.includes('D3')) {
                 return (
                    <div className="game-controls glass-card">
                        <p style={{color: 'yellow', 'textAlign': 'center'}}>必须出包含方块3的牌</p>
                    </div>
                );
            }
            return (
                <div className="game-controls glass-card">
                    <button onClick={handlePass} disabled={!lastPlayedHand}>Pass</button>
                    <button onClick={() => { handlePlayCard(selectedCards); setSelectedCards([]); }}>Play</button>
                </div>
            );
        }
        return null;
    };

    const me = players.find(p => p.id === userId || p.user_id === userId);
    const opponents = players.filter(p => p.id !== userId && p.user_id !== userId);

    return (
        <div className="game-table-container big-two-bg">
            <div className="game-table">
                <div className="opponent-seats">
                    {opponents.map(p => (
                        <Opponent
                            key={p.id ?? p.user_id}
                            name={p.name ?? p.user_id}
                            cardCount={p.hand.length}
                            isCurrentPlayer={currentPlayerId === (p.id ?? p.user_id)}
                        />
                    ))}
                </div>

                <div className="main-area">
                    <div className="play-area">
                         {lastPlayedHand && lastPlayedHand.cards?.map(card => <Card key={card} cardName={card} />)}
                    </div>
                </div>

                <div className="player-seat-area">
                    {me && (
                        <Hand 
                            initialCards={hand || []}
                            selectedCards={selectedCards}
                            setSelectedCards={setSelectedCards}
                        />
                    )}
                </div>
            </div>
            
            {renderPlayingControls()}
            
            {props.winner !== null && (
                 <div className="game-over-overlay">
                    <h2>游戏结束</h2>
                    <p>{ (props.winner === userId) ? "你赢了!" : `玩家 ${props.winner} 胜利!` }</p>
                    <button onClick={handleReturn}>返回</button>
                </div>
            )}

            <button onClick={handleReturn} className="exit-button">返回</button>
        </div>
    );
};

export default CardTable;
