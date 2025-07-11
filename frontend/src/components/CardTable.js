import React, { useState, useEffect } from 'react';
import PlayerHand from './PlayerHand';
import Opponent from './Opponent';
import CardComparison from './CardComparison';
import GameControls from './GameControls';
import { dealCards } from './utils/cardUtils'; // Assuming dealCards is implemented here or imported
import Card from './Card'; // 修复：添加Card组件导入

const CardTable = () => {
  const [players, setPlayers] = useState([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [selectedCards, setSelectedCards] = useState([]);
  const [tableCards, setTableCards] = useState([]); // Cards currently on the table (if any)
  const [comparisonResult, setComparisonResult] = useState(null);
  const [gamePhase, setGamePhase] = useState('dealing'); // Add game phase state: 'dealing', 'splitting', 'comparing'

  // Initialize players
  useEffect(() => {
    const playerNames = ['玩家1', '玩家2', '玩家3', '玩家4'];
    setPlayers(playerNames.map(name => ({
      name,
      cards: [], // All 13 cards initially
      head: [],
      middle: [],
      tail: [],
      isActive: false
    })));
  }, []);

  const handleDealCards = () => {
    const playerCount = players.length;
    // Assuming dealCards now returns an array of 13 cards for each player
    const dealtHands = dealCards(52, playerCount); // Modify dealCards to take total deck size and player count

    setPlayers(players.map((player, index) => ({
      ...player,
      cards: dealtHands[index] || [], // Assign the 13 dealt cards
      head: [], // Reset hands for new deal
      middle: [],
      tail: []
    })));

    setCurrentPlayerIndex(0);
    setPlayers(prev => prev.map((p, i) => ({
      ...p,
      isActive: i === 0
    })));
    setGamePhase('splitting'); // Move to splitting phase after dealing
    setSelectedCards([]); // Clear selected cards
    setTableCards([]); // Clear table cards
    setComparisonResult(null); // Clear comparison result
  };

  const handleCardSelect = (cards) => {
    setSelectedCards(cards);
  };

  // New function to handle splitting cards to specific area
  const handleSplitCards = (area) => {
    if (selectedCards.length === 0) {
      alert('请选择要放入牌墩的牌！');
      return;
    }

    const currentPlayer = players[currentPlayerIndex];
    const currentHand = [...currentPlayer.cards]; // Work with a copy

    // Check if the area is already filled
    if (area === 'head' && currentPlayer.head.length > 0) {
        alert('头道牌墩已满！');
        return;
    }
    if (area === 'middle' && currentPlayer.middle.length > 0) {
        alert('中道牌墩已满！');
        return;
    }
     if (area === 'tail' && currentPlayer.tail.length > 0) {
        alert('尾道牌墩已满！');
        return;
    }

    // Check if selected cards match the required number for the area
    if (area === 'head' && selectedCards.length !== 3) {
        alert('头道需要3张牌！');
        return;
    }
     if ((area === 'middle' || area === 'tail') && selectedCards.length !== 5) {
        alert('中道和尾道需要5张牌！');
        return;
    }


    // Remove selected cards from the player's hand
    const remainingCards = currentHand.filter(card => !selectedCards.includes(card));

    // Update player's hands and the specific area
    setPlayers(players.map((player, index) => {
      if (index === currentPlayerIndex) {
        return {
          ...player,
          cards: remainingCards,
          [area]: [...player[area], ...selectedCards] // Add selected cards to the area
        };
      }
      return player;
    }));

    setSelectedCards([]); // Clear selected cards after splitting

    // Optional: Check if all areas are filled to proceed to the next player or comparison
    const updatedPlayer = players[currentPlayerIndex];
     if (updatedPlayer.head.length === 3 && updatedPlayer.middle.length === 5 && updatedPlayer.tail.length === 5) {
        // Player has finished splitting
        console.log(`${updatedPlayer.name} 完成分牌`);
        // TODO: Move to next player or game phase (e.g., comparison)
     }
  };


  const handleCompare = () => {
      // TODO: Implement actual comparison logic using sssScore.js
      // For now, keep the simulated result
    const result = {
      player1: players[0]?.name,
      player2: players[1]?.name,
      player1Type: "同花顺", // Placeholder
      player2Type: "葫芦", // Placeholder
      winner: "player1", // Placeholder
      reason: "模拟比牌结果" // Placeholder
    };

    setComparisonResult(result);

    // 3秒后清除比牌结果
    setTimeout(() => {
      setComparisonResult(null);
      setGamePhase('dealing'); // Back to dealing phase for simplicity
    }, 3000);
  };

  const handleReset = () => {
    setPlayers(players.map(player => ({
      ...player,
      cards: [],
      head: [],
      middle: [],
      tail: []
    })));
    setSelectedCards([]);
    setTableCards([]);
    setComparisonResult(null);
    setGamePhase('dealing');
  };

  const canDeal = gamePhase === 'dealing'; // Only allow dealing in 'dealing' phase
  const canCompare = gamePhase === 'splitting' && players[currentPlayerIndex]?.head.length === 3 && players[currentPlayerIndex]?.middle.length === 5 && players[currentPlayerIndex]?.tail.length === 5; // Allow compare only when player has finished splitting


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
         {/* Display current player's split hands */}
        {gamePhase === 'splitting' && players[currentPlayerIndex] && (
            <div className="current-player-split-hands">
                <div className="split-hand head-hand">
                    <h4>头道 ({players[currentPlayerIndex].head.length}/3)</h4>
                    <div className="cards-container">
                         {players[currentPlayerIndex].head.map((card, index) => (
                            <Card key={`head-${index}`} card={card} size="small" />
                         ))}
                    </div>
                     {players[currentPlayerIndex].head.length === 0 && (
                         <button onClick={() => handleSplitCards('head')}>放入头道</button>
                     )}
                </div>
                 <div className="split-hand middle-hand">
                    <h4>中道 ({players[currentPlayerIndex].middle.length}/5)</h4>
                     <div className="cards-container">
                         {players[currentPlayerIndex].middle.map((card, index) => (
                            <Card key={`middle-${index}`} card={card} size="small" />
                         ))}
                    </div>
                    {players[currentPlayerIndex].middle.length === 0 && (
                         <button onClick={() => handleSplitCards('middle')}>放入中道</button>
                    )}
                </div>
                 <div className="split-hand tail-hand">
                     <h4>尾道 ({players[currentPlayerIndex].tail.length}/5)</h4>
                     <div className="cards-container">
                         {players[currentPlayerIndex].tail.map((card, index) => (
                            <Card key={`tail-${index}`} card={card} size="small" />
                         ))}
                    </div>
                    {players[currentPlayerIndex].tail.length === 0 && (
                         <button onClick={() => handleSplitCards('tail')}>放入尾道</button>
                    )}
                </div>
            </div>
        )}


        {/* Display comparison result or table cards */}
        {gamePhase === 'comparing' && comparisonResult ? (
          <CardComparison
            player1={players[0]?.head || []} // Assuming comparing head hands first
            player2={players[1]?.head || []} // Assuming comparing head hands first
            result={comparisonResult}
          />
        ) : (
           gamePhase !== 'splitting' && ( // Only show table cards if not in splitting phase
              <div className="table-cards">
                {tableCards.map((card, index) => (
                  <Card key={index} card={card} />
                ))}
              </div>
           )
        )}
      </div>

      {/* 游戏控制按钮 */}
      <GameControls
        onDeal={handleDealCards}
        onCompare={handleCompare} // TODO: Trigger comparison for all hands
        onReset={handleReset}
        canDeal={canDeal}
        canCompare={canCompare}
      />

      {/* 当前玩家手牌 */}
      {players[currentPlayerIndex]?.cards.length > 0 && gamePhase === 'splitting' && (
        <div className="current-player">
          <div className="player-info">
            <h3>{players[currentPlayerIndex].name} (你)</h3>
            <p>{players[currentPlayerIndex].cards.length}张牌</p>
          </div>
          <PlayerHand
            cards={players[currentPlayerIndex].cards}
            onCardSelect={handleCardSelect}
          />
        </div>
      )}
    </div>
  );
};

export default CardTable;
