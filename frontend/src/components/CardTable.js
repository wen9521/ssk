// frontend/src/components/CardTable.js
import React from 'react';
import { useGame } from '../context/GameContext';
import Hand from './Hand';
import './styles/GameTable.css'; // 复用游戏桌的CSS

function CardTable() {
    const {
        roomId, players, userId, roomStatus, gameType,
        isLoading, error,
    } = useGame();

    // const me = players.find(p => p.user_id === userId); // 修复: 移除未使用的变量
    const others = players.filter(p => p.user_id !== userId);
    
    // TODO: 完善回合逻辑
    const myTurn = true;
    
    const getGameTitle = () => {
        if (gameType === 'big_two') return '锄大地';
        if (gameType === 'thirteen_water') return '十三水';
        return '游戏';
    }

    return (
        <div className="game-table">
            <header className="table-header">
                <h3>{getGameTitle()} - 房间 {roomId}</h3>
                <div className="game-info">状态: {roomStatus}</div>
            </header>

            <section className="player-area">
                {/* 这是一个示例布局，可以根据具体游戏调整 */}
                <div className="top-player">
                    <div className="player-avatar">{others[1]?.user_id.substring(0, 2)}</div>
                    <div className="player-name">{others[1]?.user_id}</div>
                </div>
                <div className="side-players">
                    <div className="left-player">
                         <div className="player-avatar">{others[0]?.user_id.substring(0, 2)}</div>
                         <div className="player-name">{others[0]?.user_id}</div>
                    </div>
                    <div className="right-player">
                         <div className="player-avatar">{others[2]?.user_id.substring(0, 2)}</div>
                         <div className="player-name">{others[2]?.user_id}</div>
                    </div>
                </div>
            </section>
            
            <section className="table-center">
                 {error && <p className="error-message">{error}</p>}
                 {isLoading && <div className="loading-spinner" />}
                 {/* 十三水/锄大地可以在这里显示出牌区 */}
            </section>

            <footer className="hand-placeholder">
                <Hand myTurn={myTurn} />
                 {/* 十三水可以在这里放“理牌完成”按钮 */}
            </footer>
        </div>
    );
}

export default CardTable;
