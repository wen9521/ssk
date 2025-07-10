import React, { useState } from 'react';
import Card from '../ui/Card';
import '../../styles/Game.css';

const Game = ({ onExit, onReady, onSmartSplit }) => {
  const [gameState, setGameState] = useState('playing');
  const [selectedCards, setSelectedCards] = useState([]);
  
  // 模拟游戏数据
  const player = {
    name: '你',
    score: 120
  };
  
  const aiPlayers = [
    { name: '小明', score: 85, ready: true },
    { name: '小红', score: 95, ready: true },
    { name: '小刚', score: 78, ready: false }
  ];
  
  const handCards = ['AS', 'KH', 'QD', 'JC', '10H', '9S', '8D', '7C', '6H', '5S', '4D', '3C', '2H'];
  
  const dunCards = {
    head: ['AS', 'KH', 'QD'],
    middle: ['JC', '10H', '9S', '8D', '7C'],
    tail: ['6H', '5S', '4D', '3C', '2H']
  };
  
  const handleCardSelect = (card) => {
    if (selectedCards.includes(card)) {
      setSelectedCards(selectedCards.filter(c => c !== card));
    } else {
      setSelectedCards([...selectedCards, card]);
    }
  };
  
  const renderPlayer = (player, isMe = false) => (
    <div className={`player-card ${isMe ? 'me' : ''} ${player.ready ? 'ready' : ''}`}>
      <div className="player-avatar">
        {player.name.charAt(0)}
      </div>
      <div className="player-info">
        <div className="player-name">{player.name}</div>
        <div className="player-status">
          {isMe ? '准备中' : player.ready ? '已准备' : '思考中'}
        </div>
      </div>
      <div className="player-score">
        <span>🪙</span> {player.score}
      </div>
    </div>
  );
  
  const renderDun = (cards, title, area) => (
    <div className="dun-container">
      <div className="dun-header">
        <h3>{title}</h3>
        <span>{cards.length}张</span>
      </div>
      <div className="dun-cards">
        {cards.map((card, index) => (
          <Card 
            key={`${area}-${index}`} 
            card={card} 
            isSelected={selectedCards.includes(card)}
            onClick={() => handleCardSelect(card)}
          />
        ))}
      </div>
    </div>
  );
  
  return (
    <div className="game-container">
      {/* 游戏顶部栏 */}
      <div className="game-header">
        <button className="back-button" onClick={onExit}>
          &lt; 返回
        </button>
        <div className="room-info">
          房间: #12345
        </div>
        <div className="player-score-display">
          🪙 {player.score}
        </div>
      </div>
      
      {/* 玩家状态栏 */}
      <div className="players-container">
        {renderPlayer(player, true)}
        {aiPlayers.map((p, i) => renderPlayer(p, false))}
      </div>
      
      {/* 游戏主区域 */}
      <div className="game-area">
        {gameState === 'comparing' ? (
          <div className="comparison-view">
            <h2>比牌结果</h2>
            <div className="result-summary">
              <div className="result-item win">赢: 2道</div>
              <div className="result-item lose">输: 1道</div>
              <div className="result-item total">+15分</div>
            </div>
            <button className="action-button primary" onClick={onReady}>
              再来一局
            </button>
          </div>
        ) : (
          <>
            {renderDun(dunCards.head, '头道 (3张)', 'head')}
            {renderDun(dunCards.middle, '中道 (5张)', 'middle')}
            {renderDun(dunCards.tail, '尾道 (5张)', 'tail')}
            
            <div className="hand-cards">
              <h3>手牌</h3>
              <div className="cards-grid">
                {handCards.map((card, index) => (
                  <Card 
                    key={`hand-${index}`} 
                    card={card} 
                    isSelected={selectedCards.includes(card)}
                    onClick={() => handleCardSelect(card)}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* 游戏控制栏 */}
      <div className="game-controls">
        <button className="action-button" onClick={onExit}>
          退出
        </button>
        
        {gameState === 'playing' && (
          <>
            <button className="action-button" onClick={onSmartSplit}>
              智能分牌
            </button>
            <button 
              className="action-button primary" 
              onClick={() => setGameState('comparing')}
            >
              开始比牌
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Game;
