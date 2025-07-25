// frontend/src/components/Play.jsx

import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import GameBoard from './GameBoard';
import { useGameStore, STAGES } from '../utils/store';
import { createDeck, shuffleDeck, dealCards } from '../game-logic/deck';
import { SmartSplit, isFoul } from '../game-logic/ai-logic';
// --- 核心修复点 1：引入真实的计分函数 ---
import { calcSSSAllScores } from '../game-logic/thirteen-water-rules';

// --- 核心修复点 2：添加数据转换辅助函数 ---

// 将卡牌对象 {rank, suit} 转换为 'ace_of_spades' 格式的字符串
const toCardString = (card) => {
    const rankMap = { 'A': 'ace', 'K': 'king', 'Q': 'queen', 'J': 'jack', 'T': '10'};
    const rankStr = rankMap[card.rank] || card.rank.toLowerCase();
    return `${rankStr}_of_${card.suit}`;
};

// 将 'ace_of_spades' 格式的字符串转换回卡牌对象
const toCardObject = (str) => {
    const parts = str.split('_of_');
    const rev = { ace:'A', king:'K', queen:'Q', jack:'J', '10':'T' };
    const rank = rev[parts[0]] || parts[0].toUpperCase();
    return { rank, suit: parts[1] };
};

// 将包含卡牌对象的牌墩 {head, middle, tail} 转换为包含字符串的格式
const toHandStrings = (hand) => ({
  head: (hand.head || []).map(toCardString),
  middle: (hand.middle || []).map(toCardString),
  tail: (hand.tail || []).map(toCardString)
});


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

  // --- 核心修复点 3：重写 handleSubmit 以使用真实计分逻辑 ---
  const handleSubmit = async (myPlayerHand) => {
    // 1. 立即更新玩家状态为已提交，并保存理好的牌（对象格式）
    updatePlayerStatus('player1', { submitted: true, ...myPlayerHand });
    setStage(STAGES.SUBMITTING);

    // 2. 为 AI 玩家生成手牌，并构建所有玩家的牌堆数组
    const allPlayerHands = players.map(player => {
      if (player.id === 'player1') {
        return { id: player.id, ...myPlayerHand };
      }
      
      // AI 理牌
      const cardStrings = player.cards13.map(toCardString);
      const aiHandStrings = SmartSplit(cardStrings)[0]; // AI理牌结果是字符串格式
      
      // 将AI理好的牌（字符串）转回对象格式，用于更新状态和UI显示
      const aiHandObjects = {
          head: aiHandStrings.head.map(toCardObject),
          middle: aiHandStrings.middle.map(toCardObject),
          tail: aiHandStrings.tail.map(toCardObject)
      };
      updatePlayerStatus(player.id, { submitted: true, ...aiHandObjects });
      
      return { id: player.id, ...aiHandObjects };
    });

    // 3. 模拟后端延迟
    setTimeout(() => {
      // 4. 准备计分数据：将所有玩家的牌墩转换为计分函数所需的字符串格式
      const handsForScoring = allPlayerHands.map(p => toHandStrings(p));

      // 5. 调用计分函数
      const scoresArray = calcSSSAllScores(handsForScoring);

      // 6. 构建最终结果对象
      const finalResults = {
          scores: allPlayerHands.map((p, index) => {
              const handStrings = handsForScoring[index];
              return {
                  id: p.id,
                  totalScore: scoresArray[index],
                  isFoul: isFoul(handStrings.head, handStrings.middle, handStrings.tail),
                  // hands 属性使用对象格式，方便结果弹窗渲染
                  hands: {
                    head: p.head,
                    middle: p.middle,
                    tail: p.tail
                  }
              };
          })
      };

      // 7. 更新全局状态，触发结果显示
      setFinalResults(finalResults);
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
