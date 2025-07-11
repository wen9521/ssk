import React, { useState, useEffect } from 'react';
import PlayerHand from './PlayerHand';
import Opponent from './Opponent';
import CardComparison from './CardComparison';
import GameControls from './GameControls';
import { dealCards } from './utils/cardUtils';
import Card from './Card'; // 修复：添加Card组件导入

const CardTable = () => {
  const [players, setPlayers] = useState([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [selectedCards, setSelectedCards] = useState([]);
  const [tableCards, setTableCards] = useState([]);
  const [comparisonResult, setComparisonResult] = useState(null);
  
  // 初始化玩家
  useEffect(() => {
    const playerNames = ['玩家1', '玩家2', '玩家3', '玩家4'];
    setPlayers(playerNames.map(name => ({
      name,
      cards: [],
      isActive: false
    })));
  }, []);
  
  const handleDealCards = () => {
    const playerCount = players.length;
    const dealtCards = dealCards(playerCount);
    
    setPlayers(players.map((player, index) => ({
      ...player,
      cards: dealtCards[index]
    })));
    
    setCurrentPlayerIndex(0);
    setPlayers(prev => prev.map((p, i) => ({
      ...p,
      isActive: i === 0
    })));
  };
  
  const handleCardSelect = (cards) => {
    setSelectedCards(cards);
  };
  
  const handleCompare = () => {
    // 模拟比牌结果
    const result = {
      player1: players[0].name,
      player2: players[1].name,
      player1Type: "同花顺",
      player2Type: "葫芦",
      winner: "player1",
      reason: "同花顺大于葫芦"
    };
    
    setComparisonResult(result);
    
    // 3秒后清除比牌结果
    setTimeout(() => {
      setComparisonResult(null);
    }, 3000);
  };
  
  const handleReset = () => {
    setPlayers(players.map(player => ({
      ...player,
      cards: []
    })));
    setSelectedCards([]);
    setTableCards([]);
    setComparisonResult(null);
  };
  
  const canDeal = players.length > 0 && players[0].cards.length === 0;
  const canCompare = selectedCards.length > 0;
  
  return (
    <div className="card-table">
      {/* 顶部对手 */}
      <Opponent 
        name={players[1]?.name || "玩家2"} 
        cardCount={players[1]?.cards.length || 0} 
        position="top"
        isActive={currentPlayerIndex === 1}
      />
      
      {/* 左侧对手 */}
      <Opponent 
        name={players[2]?.name || "玩家3"} 
        cardCount={players[2]?.cards.length || 0} 
        position="left"
        isActive={currentPlayerIndex === 2}
      />
      
      {/* 右侧对手 */}
      <Opponent 
        name={players[3]?.name || "玩家4"} 
        cardCount={players[3]?.cards.length || 0} 
        position="right"
        isActive={currentPlayerIndex === 3}
      />
      
      {/* 牌桌中央 */}
      <div className="table-center">
        {comparisonResult ? (
          <CardComparison 
            player1={players[0]?.cards.slice(0, 5) || []}
            player2={players[1]?.cards.slice(0, 5) || []}
            result={comparisonResult}
          />
        ) : (
          <div className="table-cards">
            {tableCards.map((card, index) => (
              <Card key={index} card={card} />
            ))}
          </div>
        )}
      </div>
      
      {/* 游戏控制按钮 */}
      <GameControls 
        onDeal={handleDealCards}
        onCompare={handleCompare}
        onReset={handleReset}
        canDeal={canDeal}
        canCompare={canCompare}
      />
      
      {/* 当前玩家手牌 */}
      {players[0]?.cards.length > 0 && (
        <div className="current-player">
          <div className="player-info">
            <h3>{players[0].name} (你)</h3>
            <p>{players[0].cards.length}张牌</p>
          </div>
          <PlayerHand 
            cards={players[0].cards} 
            onCardSelect={handleCardSelect} 
          />
        </div>
      )}
    </div>
  );
};

export default CardTable;