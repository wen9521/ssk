// frontend/src/components/DoudizhuTable.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import Hand from './Hand';
import Opponent from './Opponent';
import Card from './Card';
import webSocketService from '../services/websocketService';
import './styles/GameTable.css';
import './styles/GameControls.css';

// This is our new, unified Doudizhu component
const DoudizhuTable = (props) => {
    // In local mode, we get everything from props. In online mode, from context.
    const isLocal = props.isLocal || false;
    
    const contextData = useGame();
    const navigate = useNavigate();
    
    // --- State Derivation ---
    // Unify state access. If local, use props. If online, use context.
    const gameState = isLocal ? props : contextData.doudizhuState || {};
    const players = isLocal ? props.players : contextData.players || [];
    const userId = isLocal ? 0 : contextData.userId; // In local, player is always 0
    const hand = isLocal ? props.players.find(p => p.id === 0)?.hand : contextData.hand;
    const roomStatus = isLocal ? props.gamePhase : contextData.roomStatus;
    const landlordId = isLocal ? props.landlord : gameState.landlord;
    const currentTurnPlayerId = isLocal ? props.currentPlayer : gameState.biddingState?.currentBidderId || gameState.currentPlayerId;
    
    // --- Actions ---
    // Unify action handlers
    const handleBid = isLocal ? props.onBid : contextData.handleBid;
    const handlePlayCard = isLocal ? (selectedCards) => props.onPlay(selectedCards) : contextData.handlePlayCard;
    const handlePass = isLocal ? props.onPass : () => contextData.handlePlayCard([]); // Assuming empty array means pass in online
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

    const renderBiddingControls = () => {
        if (roomStatus === 'bidding' && currentTurnPlayerId === userId) {
            return (
                <div className="game-controls glass-card">
                    <button onClick={() => handleBid(1)} disabled={props.landlordBid >= 1}>1分</button>
                    <button onClick={() => handleBid(2)} disabled={props.landlordBid >= 2}>2分</button>
                    <button onClick={() => handleBid(3)} disabled={props.landlordBid >= 3}>3分</button>
                    <button onClick={() => handleBid(0)}>不叫</button>
                </div>
            );
        }
        return null;
    };
    
    const renderPlayingControls = () => {
        if (roomStatus === 'playing' && currentTurnPlayerId === userId) {
            return (
                <div className="game-controls glass-card">
                    <button onClick={() => handlePass()} disabled={!gameState.lastPlayedHand}>Pass</button>
                    <button onClick={() => { handlePlayCard(selectedCards); setSelectedCards([]); }}>Play</button>
                </div>
            )
        }
        return null;
    }

    const me = players.find(p => p.id === userId || p.user_id === userId);
    const opponents = players.filter(p => p.id !== userId && p.user_id !== userId);

    return (
        <div className="game-table-container doudizhu-bg">
            <div className="game-table">
                <div className="opponent-seats">
                     {opponents.map(p => (
                        <Opponent
                            key={p.id ?? p.user_id}
                            name={p.name ?? p.user_id}
                            cardCount={p.hand.length}
                            isLandlord={landlordId === (p.id ?? p.user_id)}
                            isCurrentPlayer={currentTurnPlayerId === (p.id ?? p.user_id)}
                        />
                    ))}
                </div>

                <div className="main-area">
                    {props.landlordCards && (
                        <div className="landlord-cards-display">
                            {props.landlordCards.map(card => <Card key={card} cardName={card} />)}
                        </div>
                    )}
                    <div className="play-area">
                         {gameState.lastPlayedHand && gameState.lastPlayedHand.cards?.map(card => <Card key={card} cardName={card} />)}
                    </div>
                </div>

                <div className="player-seat-area">
                    {me && (
                        <Hand 
                            initialCards={hand || []} 
                            onPlay={() => {}} // Play is handled by controls now
                            selectedCards={selectedCards}
                            setSelectedCards={setSelectedCards}
                        />
                    )}
                </div>
            </div>
            
            {renderBiddingControls()}
            {renderPlayingControls()}

            <button onClick={handleReturn} className="exit-button">返回</button>
        </div>
    );
};

export default DoudizhuTable;
