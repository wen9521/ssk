// frontend/src/components/ModeSelector.js
import React from 'react';
import { useGame } from '../context/GameContext';
import './styles/ModeSelector.css';

function ModeSelector() {
    const { 
        gameType, 
        isLoading, 
        error,
        goBackToGameSelection,
        handleQuickPlay,
        handleMatchmaking,
        isMatching, // 获取是否正在匹配的状态
        handleCancelMatchmaking // 获取取消函数
    } = useGame();
    
    const getGameName = (type) => {
        const gameMap = {
            'thirteen_water': '十三水', 'doudizhu': '斗地主', 'big_two': '锄大地'
        };
        return gameMap[type] || '未知游戏';
    }

    const renderDefaultView = () => (
        <div className="mode-selector-actions">
            <button className="mode-button" onClick={handleQuickPlay} disabled={isLoading}>
                人机试玩
                <span className="mode-button-desc">立刻与AI开始一局游戏</span>
            </button>
            <button className="mode-button" onClick={handleMatchmaking} disabled={isLoading}>
                自动匹配
                <span className="mode-button-desc">寻找旗鼓相当的对手</span>
            </button>
        </div>
    );

    const renderMatchingView = () => (
        <div className="mode-selector-actions">
            <h4>正在寻找对手...</h4>
            <div className="loading-spinner" style={{margin: '1rem auto'}}/>
            <button onClick={handleCancelMatchmaking} disabled={isLoading} style={{backgroundColor: 'var(--secondary-color)'}}>
                取消匹配
            </button>
        </div>
    );


    return (
        <div className="mode-selector-container glass-card">
            <button onClick={goBackToGameSelection} className="back-button" disabled={isMatching}>&larr;</button>
            <h2 className="mode-selector-header">{getGameName(gameType)}</h2>

            {error && <p className="error-message">{error}</p>}
            
            { isMatching ? renderMatchingView() : renderDefaultView() }
            
            {/* 全局加载指示器 (用于加入匹配时的短暂loading) */}
            {isLoading && !isMatching && <div className="loading-spinner" />} 
        </div>
    );
}

export default ModeSelector;
