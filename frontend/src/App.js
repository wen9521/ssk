// src/App.js

import React, { useState, useEffect } from 'react';
import Lobby from './components/game/Lobby';
import PokerTable from './components/game/PokerTable';
import usePollingGameState from './hooks/usePollingGameState';
import { dealCards, isFoul as checkIsFoul } from './utils/game/cardUtils';
import { aiSmartSplit } from './utils/ai/SmartSplit';
import { calcSSSAllScores } from './utils/game/sssScore';
import './styles/App.css';

const BACKEND_DOMAIN = "https://9525.ip-ddns.com";
const AI_NAMES = ['AI·关羽', 'AI·张飞', 'AI·赵云'];

const cardToLegacyFormat = (card) => {
    const rankStr = card.slice(0, -1);
    const suitChar = card.slice(-1);
    const rankMap = { 'A': 'ace', 'K': 'king', 'Q': 'queen', 'J': 'jack', '10': '10', '9': '9', '8': '8', '7': '7', '6': '6', '5': '5', '4': '4', '3': '3', '2': '2' };
    const suitMap = { '♠': 'spades', '♥': 'hearts', '♦': 'diamonds', '♣': 'clubs' };
    if (!rankMap[rankStr] || !suitMap[suitChar]) return '2_of_clubs';
    return `${rankMap[rankStr]}_of_${suitMap[suitChar]}`;
};

const dunFromLegacyFormat = (dun) => {
    const rankMap = { 'ace': 'A', 'king': 'K', 'queen': 'Q', 'jack': 'J', '10': '10', '9': '9', '8': '8', '7': '7', '6': '6', '5': '5', '4': '4', '3': '3', '2': '2' };
    const suitMap = { 'spades': '♠', 'hearts': '♥', 'diamonds': '♦', 'clubs': '♣' };
    const convertCard = (card) => {
        const parts = card.split('_of_');
        const rank = rankMap[parts[0]];
        const suit = suitMap[parts[1]];
        return rank && suit ? rank + suit : '2♣';
    };
    if (!dun || !dun.head || !dun.middle || !dun.tail) return { dun1: [], dun2: [], dun3: [] };
    return {
        dun1: dun.head.map(convertCard),
        dun2: dun.middle.map(convertCard),
        dun3: dun.tail.map(convertCard),
    };
};

const initialGameState = {
  status: 'lobby',
  players: [],
  scores: [],
  fullDeck: [],
  selectedCards: [], 
  tempDuns: { dun1: [], dun2: [], dun3: [] },
  isFoul: false,
};

export default function App() {
  const [roomId, setRoomId] = useState('');
  const [playerIdx, setPlayerIdx] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [msg, setMsg] = useState('欢迎来到十三水游戏');
  const [isActionDisabled, setIsActionDisabled] = useState(false);
  const [gameState, setGameState] = useState(initialGameState);
  const onlineGameState = usePollingGameState(roomId, isOnline ? 1500 : null);

  useEffect(() => {
    if (isOnline && onlineGameState) {
      setGameState(onlineGameState);
    }
  }, [onlineGameState, isOnline]);

  const resetToLobby = () => {
    setRoomId('');
    setPlayerIdx(null);
    setIsOnline(false);
    setGameState(initialGameState);
    setMsg('欢迎来到十三水游戏');
    setIsActionDisabled(false);
  };

  // [修正] 这是本次修复的核心，确保 startTryPlay 正确初始化所有 gameState 属性
  const startTryPlay = () => {
    setIsActionDisabled(true);
    setMsg('正在洗牌和发牌...');
    
    const numPlayers = 4;
    const { fullDeck, playerHands } = dealCards(numPlayers);

    const players = Array(numPlayers).fill(null).map((_, i) => ({
      name: i === 0 ? '你' : AI_NAMES[i - 1],
      hand: [], // 动画开始时手牌为空
      dun: null,
    }));
    
    // 初始化游戏状态，准备开始动画
    setGameState({
      ...initialGameState, // 使用 initialGameState 作为基础，确保所有字段都被重置
      status: 'dealing',
      players,
      fullDeck
    });
    setPlayerIdx(0);
    setIsOnline(false);

    let cardIndex = 0;
    const dealInterval = setInterval(() => {
      setGameState(prev => {
        if (!prev.players || prev.players.length === 0) return prev;
        const newPlayers = [...prev.players];
        const playerToReceive = cardIndex % numPlayers;
        if(newPlayers[playerToReceive]) {
          newPlayers[playerToReceive].hand.push(fullDeck[cardIndex]);
        }
        return { ...prev, players: newPlayers };
      });
      cardIndex++;

      if (cardIndex >= 52) {
        clearInterval(dealInterval);
        
        setTimeout(() => {
          setMsg('AI 正在理牌...');
          setGameState(prev => {
            const playersAfterAI = prev.players.map((p, i) => {
              const finalHand = playerHands[i];
              if (i === 0) {
                return { ...p, hand: finalHand };
              }
              const legacyHand = finalHand.map(cardToLegacyFormat);
              const splitResultLegacy = aiSmartSplit(legacyHand);
              const splitResult = dunFromLegacyFormat(splitResultLegacy);
              return { ...p, hand: finalHand, dun: splitResult };
            });
            // [修正] 确保在进入 playing 状态时，所有理牌相关状态被正确初始化
            return { 
                ...prev, 
                players: playersAfterAI, 
                status: 'playing',
                tempDuns: { dun1: [], dun2: [], dun3: [] }, // 关键！
                selectedCards: [],                          // 关键！
                isFoul: false                               // 关键！
            };
          });
          setMsg('发牌完成，请您理牌。');
          setIsActionDisabled(false);
        }, 500);
      }
    }, 60);
  };
  
  const handleSelectCard = (card) => {
    setGameState(prev => {
        if (prev.status !== 'playing') return prev;
        const selected = prev.selectedCards || [];
        const isSelected = selected.includes(card);
        const newSelectedCards = isSelected 
            ? selected.filter(c => c !== card)
            : [...selected, card];
        return { ...prev, selectedCards: newSelectedCards };
    });
  };

  const handleMoveToDun = (dunName) => {
    setGameState(prev => {
        if (prev.status !== 'playing' || !prev.selectedCards || prev.selectedCards.length === 0) return prev;
        
        const tempDuns = JSON.parse(JSON.stringify(prev.tempDuns));
        const selectedCards = [...prev.selectedCards];
        
        Object.keys(tempDuns).forEach(key => {
            tempDuns[key] = tempDuns[key].filter(c => !selectedCards.includes(c));
        });
        
        tempDuns[dunName] = [...tempDuns[dunName], ...selectedCards];

        const limits = { dun1: 3, dun2: 5, dun3: 5 };
        if (tempDuns[dunName].length > limits[dunName]) {
            setMsg(`此墩最多只能放 ${limits[dunName]} 张牌！`);
            return prev;
        }
        
        const foul = checkIsFoul(tempDuns.dun1, tempDuns.dun2, tempDuns.dun3);
        setMsg(foul ? "警告：当前牌型已倒水！" : "理牌中...");
        return { ...prev, tempDuns, selectedCards: [], isFoul: foul };
    });
  };

  const handleSubmitDun = () => {
      const { tempDuns } = gameState;

      if (tempDuns.dun1.length !== 3 || tempDuns.dun2.length !== 5 || tempDuns.dun3.length !== 5) {
          setMsg("请按头道3张、中道5张、尾道5张分配好再提交！");
          return;
      }
      if (gameState.isFoul) {
          if (!window.confirm("当前牌型已倒水，确定要提交吗？")) return;
      }
      
      setMsg("理牌已提交，正在比牌...");
      setGameState(prev => {
          const updatedPlayers = [...prev.players];
          if (updatedPlayers[playerIdx]) {
            updatedPlayers[playerIdx].dun = prev.tempDuns;
          }

          const allPlayersReady = updatedPlayers.every(p => p && p.dun);
          
          if (allPlayersReady) {
              const playerDunsForScoring = updatedPlayers.map(p => 
                  p.dun ? { head: p.dun.dun1, middle: p.dun.dun2, tail: p.dun.dun3 } : null
              );
              
              const scores = calcSSSAllScores(playerDunsForScoring);
              setMsg("比牌完成！");
              return { ...prev, players: updatedPlayers, status: 'finished', scores, selectedCards: [] };
          }
          
          return { ...prev, players: updatedPlayers, selectedCards: [] };
      });
  };
  
  const handleSmartSplit = () => {
    if (gameState.status !== 'playing' || !gameState.players[playerIdx]) return;
    const myFullHand = [...gameState.players[playerIdx].hand]; 
    const legacyHand = myFullHand.map(cardToLegacyFormat);
    const splitResultLegacy = aiSmartSplit(legacyHand);
    const duns = dunFromLegacyFormat(splitResultLegacy);
    setGameState(prev => ({
        ...prev,
        tempDuns: duns,
        isFoul: checkIsFoul(duns.dun1, duns.dun2, duns.dun3),
    }));
    setMsg("已为您智能理牌，可直接提交或微调。");
  };

  const handleResetGame = () => {
    if (isOnline) {
      // online logic...
    } else {
      startTryPlay();
    }
  };

  return (
    <div className="app-container">
      {gameState.status === 'lobby' ? (
        <Lobby msg={msg} roomId={roomId} isActionDisabled={isActionDisabled} onSetRoomId={setRoomId} onStartTryPlay={startTryPlay} />
      ) : (
        <PokerTable
          gameState={gameState}
          playerIdx={playerIdx}
          msg={msg}
          onResetGame={handleResetGame}
          onSubmitDun={handleSubmitDun}
          onSmartSplit={handleSmartSplit}
          onSelectCard={handleSelectCard}
          onMoveToDun={handleMoveToDun}
          onExit={resetToLobby}
        />
      )}
    </div>
  );
}
