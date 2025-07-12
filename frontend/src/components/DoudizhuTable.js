// frontend/src/components/DoudizhuTable.js
import React from 'react';
import { useGame } from '../context/GameContext';
import Hand from './Hand';
import Card from './Card';
import './styles/GameTable.css';

function DoudizhuTable() {
    const {
        roomId, players, userId, roomStatus,
        doudizhuState, isLoading, error, handleBid
    } = useGame();
    
    const { landlord, landlordCards, biddingState } = doudizhuState;
    const me = players.find(p => p.user_id === userId);
    const others = players.filter(p => p.user_id !== userId);

    // TODO: 从 gameState 中获取当前轮到的玩家
    const currentPlayerTurn = userId;
    const myTurn = roomStatus === 'playing' && currentPlayerTurn === userId;
    const amICurrentBidder = biddingState?.playerIds[biddingState.turnIndex] === userId;

    const renderBiddingControls = () => { /* ... (功能不变，样式可在全局CSS中调整) ... */ };
    
    return (
        <div className="game-table">
            <header className="table-header">
                <h3>斗地主 - 房间 {roomId}</h3>
                <div className="game-info">
                    {roomStatus === 'bidding' && '正在叫地主...'}
                    {roomStatus === 'playing' && `轮到 ${currentPlayerTurn} 出牌`}
                    {roomStatus === 'finished' && `游戏结束`}
                </div>
            </header>

            <section className="player-area">
                {/* 仅为示例，真实布局会更复杂 */}
                <div className="top-player">
                    <div className="player-avatar">{others[0]?.user_id.substring(0, 2)}</div>
                    <div className="player-name">{others[0]?.user_id}</div>
                    <div className="player-status">{others[0]?.is_creator ? '房主' : ''}</div>
                </div>
                <div className="side-players">
                    <div className="left-player">
                         <div className="player-avatar">{others[1]?.user_id.substring(0, 2)}</div>
                         <div className="player-name">{others[1]?.user_id}</div>
                    </div>
                    <div className="right-player">
                         <div className="player-avatar">{others[2]?.user_id.substring(0, 2)}</div>
                         <div className="player-name">{others[2]?.user_id}</div>
                    </div>
                </div>
            </section>

            <section className="table-center">
                {landlord && (
                    <div className="landlord-cards">
                        {landlordCards.map(c => <Card key={c} cardName={c} />)}
                    </div>
                )}
                 {error && <p className="error-message">{error}</p>}
                 {isLoading && <div className="loading-spinner" />}
            </section>
            
            <footer className="hand-placeholder">
                <Hand myTurn={myTurn || amICurrentBidder} />
                {roomStatus === 'bidding' && amICurrentBidder && renderBiddingControls()}
            </footer>
        </div>
    );
}

export default DoudizhuTable;
