// frontend/src/components/ThirteenWater.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import SmartSplit from './SmartSplit';
import SssScore from './sssScore'; 
import Opponent from './Opponent';
import './styles/GameTable.css';

const ThirteenWater = (props) => {
    const isLocal = props.isLocal || false;
    
    const contextData = useGame();
    const navigate = useNavigate();

    // --- State Derivation ---
    const players = isLocal ? props.players : contextData.players || [];
    const userId = isLocal ? 0 : contextData.userId;
    const hand = isLocal ? props.players.find(p => p.id === 0)?.hand : [];
    const gamePhase = isLocal ? props.gamePhase : contextData.roomStatus;
    
    // --- Actions ---
    const handleSetDun = isLocal ? props.onSetDun : contextData.handleSetDun;
    const handleRestart = isLocal ? () => props.onRestart() : () => { /* Online restart logic */ };
    const handleReturn = isLocal ? handleRestart : () => navigate('/lobby'); // In local, the button always restarts

    const renderGameContent = () => {
        switch (gamePhase) {
            case 'arranging':
                const me = players.find(p => p.id === userId);
                if (me && me.arrangement) {
                    return (
                        <div className="game-phase-message">
                            <h2>等待比牌</h2>
                            <p>您已理好牌，所有玩家准备好后将自动进入比牌环节。</p>
                            <div className="loading-spinner"></div>
                        </div>
                    );
                }
                return (
                    <div className="thirteen-water-arranging">
                        <h2>理牌阶段</h2>
                        <p>请将你的13张牌拖拽到前、中、后三墩。完成后点击“理牌完成”按钮。</p>
                        <SmartSplit 
                            playerHand={hand} 
                            onDunSet={handleSetDun} 
                        />
                    </div>
                );
            
            case 'scoring':
                return (
                     <SssScore players={players} onRestart={handleRestart} />
                );

            default:
                return <div className="game-phase-message">正在加载游戏...</div>;
        }
    };

    const opponents = players.filter(p => (p.id ?? p.user_id) !== userId);

    return (
        <div className="game-table-container thirteen-water-bg">
            <div className="game-table">
                {/* We only show opponents during the arranging phase */}
                {gamePhase === 'arranging' && (
                    <div className="opponent-seats">
                        {opponents.map(p => (
                            <Opponent 
                                key={p.id ?? p.user_id} 
                                name={p.name ?? p.user_id} 
                                // All AIs are ready by default in our local game
                                isReady={!!p.arrangement} 
                            />
                        ))}
                    </div>
                )}

                <div className="main-area">
                    {renderGameContent()}
                </div>
            </div>
             {/* The exit button is now part of the SssScore component for the scoring phase */}
             {gamePhase === 'arranging' && 
                <button onClick={() => navigate('/')} className="exit-button">返回大厅</button>
             }
        </div>
    );
};

export default ThirteenWater;
