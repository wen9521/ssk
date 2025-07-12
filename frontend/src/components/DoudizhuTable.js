// frontend/src/components/DoudizhuTable.js
import React from 'react';
import { useGame } from '../context/GameContext';
import Hand from './Hand';
import Card from './Card';
import './styles/GameTable.css';

function DoudizhuTable() {
    const {
        roomId, players, userId, roomStatus,
        doudizhuState, isLoading, error, handleBid // 修复: handleBid 将被使用
    } = useGame();
    
    const { landlord, landlordCards, biddingState } = doudizhuState;
    // const me = players.find(p => p.user_id === userId); // 修复: 移除未使用的变量
    const others = players.filter(p => p.user_id !== userId);

    // TODO: 从 gameState 中获取当前轮到谁
    const currentPlayerTurn = userId;
    const myTurn = roomStatus === 'playing' && currentPlayerTurn === userId;
    const amICurrentBidder = biddingState?.playerIds[biddingState.turnIndex] === userId;

    const renderBiddingControls = () => {
        if (roomStatus !== 'bidding' || !amICurrentBidder) {
            return null; // 如果不是我叫分，则不显示任何东西
        }

        const highestBid = biddingState?.highestBid || 0;

        return (
            <div className="hand-actions"> {/* 复用 hand-actions 样式 */}
                <button onClick={() => handleBid(0)} disabled={isLoading}>不叫</button>
                {highestBid < 1 && <button onClick={() => handleBid(1)} disabled={isLoading}>1分</button>}
                {highestBid < 2 && <button onClick={() => handleBid(2)} disabled={isLoading}>2分</button>}
                {highestBid < 3 && <button onClick={() => handleBid(3)} disabled={isLoading}>3分</button>}
            </div>
        );
    };
    
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
                    {/* 斗地主只有3个玩家，所以右边留空 */}
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
                <Hand myTurn={myTurn} />
                {renderBiddingControls()}
            </footer>
        </div>
    );
}

export default DoudizhuTable;
