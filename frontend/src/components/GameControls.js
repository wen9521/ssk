// frontend/src/components/GameControls.js
import React from 'react';
import './styles/GameControls.css';

/**
 * 游戏操作控制组件
 * @param {string} phase - 当前游戏阶段 ('bidding', 'playing')
 * @param {function} onBid - 叫分时的回调函数
 * @param {function} onPlay - 出牌时的回调函数
 * @param {function} onPass - 不出时的回调函数
 * @param {function} onHint - 提示时的回调函数
 * @param {boolean} canPlay - 是否可以点击“出牌”按钮（是否选择了牌）
 */
const GameControls = ({ phase, onBid, onPlay, onPass, onHint, canPlay }) => {

    if (phase === 'bidding') {
        return (
            <div className="game-controls">
                <button onClick={() => onBid(1)} className="control-btn bid-btn">1分</button>
                <button onClick={() => onBid(2)} className="control-btn bid-btn">2分</button>
                <button onClick={() => onBid(3)} className="control-btn bid-btn">3分</button>
                <button onClick={() => onBid(0)} className="control-btn pass-btn">不叫</button>
            </div>
        );
    }

    if (phase === 'playing') {
        return (
            <div className="game-controls">
                <button onClick={onPass} className="control-btn pass-btn">不出</button>
                <button onClick={onHint} className="control-btn hint-btn">提示</button>
                <button onClick={onPlay} className="control-btn play-btn" disabled={!canPlay}>出牌</button>
            </div>
        );
    }

    return null; // 其他阶段不显示控制器
};

export default GameControls;
