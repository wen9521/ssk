// frontend/src/components/Play.jsx

import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import GameBoard from './GameBoard';
import { useGameStore, STAGES } from '../utils/store';
import { createDeck, shuffleDeck, dealCards } from '../game-logic/deck';
import { SmartSplit } from '../game-logic/ai-logic';

export default function Play() {
  const navigate = useNavigate();
  const { players, dealNewRound, setFinalResults, updatePlayerStatus, setStage } = useGameStore();

  const handlePlayAgain = useCallback(() => {
    const deck = createDeck();
    const shuffled = shuffleDeck(deck);
    const [p1, p2, p3, p4] = dealCards(shuffled, 13, 4);
    dealNewRound([p1, p2, p3, p4]);
  }, [dealNewRound]);

  useEffect(() => {
    handlePlayAgain();
  }, [handlePlayAgain]);

  // Helper to convert card object to string for AI logic
  const toCardString = (card) => {
      const rankMap = { 'A': 'ace', 'K': 'king', 'Q': 'queen', 'J': 'jack', 'T': '10'};
      const rankStr = rankMap[card.rank] || card.rank.toLowerCase();
      return `${rankStr}_of_${card.suit}`;
  };

  const handleSubmit = async (mySortedHand) => {
    // 立即更新玩家状态为已提交
    updatePlayerStatus('player1', { submitted: true, ...mySortedHand });
    setStage(STAGES.SUBMITTING);

    // 为 AI 玩家生成手牌
    const payload = players.map(player => {
      if (player.id === 'player1') {
        return { id: player.id, hands: mySortedHand };
      }
      
      const cardStrings = player.cards13.map(toCardString);
      const aiHand = SmartSplit(cardStrings)[0]; // Get the best split
      // AI hand needs to be in the same object format
      const aiHandObj = {
          head: aiHand.head,
          middle: aiHand.middle,
          tail: aiHand.tail
      };
      updatePlayerStatus(player.id, { submitted: true, ...aiHandObj });
      return { id: player.id, hands: aiHandObj };
    });

    // 模拟后端延迟和计算
    setTimeout(() => {
      // 在前端模拟计算结果 (这里可以替换为真实 API 调用)
      // For now, let's create mock results
      const mockResults = {
          scores: players.map(p => ({
              id: p.id,
              totalScore: Math.floor(Math.random() * 20) - 10,
              isFoul: false,
              hands: p.id === 'player1' ? mySortedHand : payload.find(pl=>pl.id === p.id).hands,
          }))
      };
      setFinalResults(mockResults);
    }, 1500); // 1.5秒延迟
  };

  const handleQuit = () => {
    navigate('/');
  };

  if (!players || players.length === 0 || !players.find(p=>p.id === 'player1')) {
    return <div>Loading...</div>;
  }

  return (
    <GameBoard
      players={players}
      myPlayerId="player1"
      onCompare={handleSubmit}
      onRestart={handlePlayAgain}
      onQuit={handleQuit}
    />
  );
}
