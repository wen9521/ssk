// frontend/src/components/ThirteenWater.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import SmartSplit from './SmartSplit';
import Opponent from './Opponent';
import Card from './Card'; // To display final arrangements
import './styles/GameTable.css';

const ThirteenWater = (props) => {
    const isLocal = props.isLocal || false;
    
    const contextData = useGame();
    const navigate = useNavigate();

    // --- State Derivation ---
    const players = isLocal ? props.players : contextData.players || [];
    const userId = isLocal ? 0 : contextData.userId;
    const hand = isLocal ? props.players.find(p => p.id === 0)?.hand : contextData.hand;
    const gamePhase = isLocal ? props.gamePhase : contextData.roomStatus;

    // --- Actions ---
    const handleSetDun = isLocal ? props.onSetDun : contextData.handleSetDun;
    const handleReturn = isLocal ? props.handleReturn : () => navigate('/lobby');

    // --- UI Rendering ---
    
    const renderArrangement = (arrangement) => {
        if (!arrangement) return <p>理牌中...</p>;
        return (
            <div className="arrangement-display">
                <div className="dun">{arrangement.front.map(c => <Card key={c} cardName={c} />)}</div>
                <div className="dun">{arrangement.middle.map(c => <Card key={c} cardName={c} />)}</div>
                <div className="dun">{arrangement.back.map(c => <Card key={c} cardName={c} />)}</div>
            </div>
        );
    };

    const renderGameContent = () => {
        if (gamePhase === 'arranging') {
            const me = players.find(p => p.id === userId);
            // If my arrangement is set, show waiting message. Otherwise, show SmartSplit.
            if (me && me.arrangement) {
                 return <div className="game-phase-message">等待AI完成理牌...</div>;
            }
            return (
                <SmartSplit 
                    playerHand={hand} 
                    onDunSet={handleSetDun} 
                />
            );
        }
        
        if (gamePhase === 'scoring') {
            return (
                <div className="game-phase-message">
                    <h2>比牌结果</h2>
                    {/* TODO: Add scoring display logic here */}
                    <p>比牌阶段逻辑待实现。</p>
                </div>
            );
        }

        return <div className="game-phase-message">正在加载...</div>;
    };

    const me = players.find(p => p.id === userId || p.user_id === userId);
    const opponents = players.filter(p => p.id !== userId && p.user_id !== userId);

    return (
        <div className="game-table-container thirteen-water-bg">
            <div className="game-table">
                <div className="opponent-seats">
                    {opponents.map(p => (
                        <Opponent 
                            key={p.id ?? p.user_id} 
                            name={p.name ?? p.user_id} 
                            isReady={!!p.arrangement} 
                        />
                    ))}
                </div>

                <div className="main-area">
                    {gamePhase === 'scoring' 
                        ? (
                             <div className="all-arrangements">
                                {players.map(p => (
                                    <div key={p.id} className="player-final-hand">
                                        <h4>{p.name}</h4>
                                        {renderArrangement(p.arrangement)}
                                    </div>
                                ))}
                             </div>
                        )
                        : renderGameContent()
                    }
                </div>

                <div className="player-seat-area">
                   {gamePhase === 'arranging' && <p>请将您的13张牌分为三墩</p>}
                </div>
            </div>
            <button onClick={handleReturn} className="exit-button">返回</button>
        </div>
    );
};

export default ThirteenWater;
