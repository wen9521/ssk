import React, { useState, useEffect } from 'react';
import Lobby from './components/game/Lobby';
import PokerTable from './components/game/PokerTable';
import usePollingGameState from './hooks/usePollingGameState';
import { dealCards } from './utils/game/cardUtils';
import { aiSmartSplit } from './utils/ai/SmartSplit';
import { calcSSSAllScores } from './utils/game/sssScore';
import './styles/App.css';

const BACKEND_DOMAIN = "https://9525.ip-ddns.com";
const AI_NAMES = ['AI·关羽', 'AI·张飞', 'AI·赵云'];

// [新增] 适配器函数：将新格式 'A♠' 转换为 AI 能理解的旧格式 'ace_of_spades'
const cardToLegacyFormat = (card) => {
    const rankStr = card.slice(0, -1);
    const suitChar = card.slice(-1);
    const rankMap = { 'A': 'ace', 'K': 'king', 'Q': 'queen', 'J': 'jack', '10': '10', '9': '9', '8': '8', '7': '7', '6': '6', '5': '5', '4': '4', '3': '3', '2': '2' };
    const suitMap = { '♠': 'spades', '♥': 'hearts', '♦': 'diamonds', '♣': 'clubs' };
    if (!rankMap[rankStr] || !suitMap[suitChar]) return '2_of_clubs'; // Fallback
    return `${rankMap[rankStr]}_of_${suitMap[suitChar]}`;
};

// [新增] 适配器函数：将 AI 返回的旧格式牌墩转换回新格式
const dunFromLegacyFormat = (dun) => {
    const rankMap = { 'ace': 'A', 'king': 'K', 'queen': 'Q', 'jack': 'J', '10': '10', '9': '9', '8': '8', '7': '7', '6': '6', '5': '5', '4': '4', '3': '3', '2': '2' };
    const suitMap = { 'spades': '♠', 'hearts': '♥', 'diamonds': '♦', 'clubs': '♣' };
    const convertCard = (card) => {
        const parts = card.split('_of_');
        const rank = rankMap[parts[0]];
        const suit = suitMap[parts[1]];
        return rank && suit ? rank + suit : '2♣'; // Fallback
    };
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

  const startTryPlay = () => {
    setIsActionDisabled(true);
    setMsg('正在洗牌和发牌...');
    
    const numPlayers = 4;
    const { fullDeck, playerHands } = dealCards(numPlayers);

    const players = Array(numPlayers).fill(null).map((_, i) => ({
      name: i === 0 ? '你' : AI_NAMES[i - 1],
      hand: [],
      dun: null,
    }));
    
    setGameState({ status: 'dealing', players, scores: [], fullDeck });
    setPlayerIdx(0);
    setIsOnline(false);

    let cardIndex = 0;
    const dealInterval = setInterval(() => {
      setGameState(prev => {
        const newPlayers = [...prev.players];
        const playerToReceive = cardIndex % numPlayers;
        newPlayers[playerToReceive].hand.push(fullDeck[cardIndex]);
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
              // [修正] 调用AI前转换手牌格式
              const legacyHand = finalHand.map(cardToLegacyFormat);
              const splitResultLegacy = aiSmartSplit(legacyHand);
              // [修正] 将AI返回结果转换回新格式
              const splitResult = dunFromLegacyFormat(splitResultLegacy);

              return { ...p, hand: finalHand, dun: splitResult };
            });
            return { ...prev, players: playersAfterAI, status: 'playing' };
          });
          setMsg('发牌完成，请您理牌。');
          setIsActionDisabled(false);
        }, 500);
      }
    }, 60);
  };
  
  const handleSubmitDun = (duns) => {
      setMsg("理牌已提交，正在比牌...");
      setGameState(prev => {
          const updatedPlayers = [...prev.players];
          updatedPlayers[playerIdx].dun = duns;

          const allPlayersReady = updatedPlayers.every(p => p.dun !== null);
          if (allPlayersReady) {
              const playerDunsForScoring = updatedPlayers.map(p => p.dun ? ({ head: p.dun.dun1, middle: p.dun.dun2, tail: p.dun.dun3 }) : null);
              const scores = calcSSSAllScores(playerDunsForScoring);
              setMsg("比牌完成！");
              return { ...prev, players: updatedPlayers, status: 'finished', scores };
          }
          return { ...prev, players: updatedPlayers };
      });
  };

  const handleResetGame = () => {
    if (isOnline) {
      // online logic...
    } else {
      startTryPlay();
    }
  };
  
  // A dummy smart split for the player for now
  const handleSmartSplit = () => {
    if (gameState.status !== 'playing' || !gameState.players[playerIdx]) return;
    const myHand = gameState.players[playerIdx].hand;
    const legacyHand = myHand.map(cardToLegacyFormat);
    const splitResultLegacy = aiSmartSplit(legacyHand);
    const duns = dunFromLegacyFormat(splitResultLegacy);
    handleSubmitDun(duns);
  };

  return (
    <div className="app-container">
      {gameState.status === 'lobby' ? (
        <Lobby
          msg={msg}
          roomId={roomId}
          isActionDisabled={isActionDisabled}
          onSetRoomId={setRoomId}
          onStartTryPlay={startTryPlay}
        />
      ) : (
        <PokerTable
          gameState={gameState}
          playerIdx={playerIdx}
          msg={msg}
          onResetGame={handleResetGame}
          onSubmitDun={handleSmartSplit} // For now, submit is same as smart split for simplicity
          onSmartSplit={handleSmartSplit}
          onExit={resetToLobby}
        />
      )}
    </div>
  );
}
