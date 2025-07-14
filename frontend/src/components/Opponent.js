// frontend/src/components/Opponent.js
import React from 'react';
import './styles/GameTable.css'; // 复用GameTable中的样式

const Opponent = ({ name, isReady, cardsInfo }) => {
    const statusText = isReady ? '已准备' : '理牌中...';
    const statusClass = isReady ? 'status-ready' : 'status-waiting';

    return (
        <div className="opponent-seat">
            <div className="opponent-name">{name}</div>
            <div className={`opponent-status ${statusClass}`}>{statusText}</div>
            {/* 未来可以在这里展示对手的牌墩信息 */}
            {/* 
            {cardsInfo && (
                <div className="opponent-cards-preview">
                    <div>前墩: {cardsInfo.front.type}</div>
                    <div>中墩: {cardsInfo.middle.type}</div>
                    <div>后墩: {cardsInfo.back.type}</div>
                </div>
            )}
            */}
        </div>
    );
};

export default Opponent;
