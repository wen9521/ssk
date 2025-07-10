// src/App.js

import React, { useState, useEffect } from 'react';
import Lobby from './components/game/Lobby';
import PokerTable from './components/game/PokerTable';
import usePollingGameState from './hooks/usePollingGameState';
// [修改] 从 cardUtils 导入所有游戏规则
import { dealCards, isFoul as checkIsFoul } from './utils/game/cardUtils';
import { aiSmartSplit } from './utils/ai/SmartSplit';
import { calcSSSAllScores } from './utils/game/sssScore';
import './styles/App.css';

// ... 适配器函数 (保持不变) ...
const cardToLegacyFormat = (card) => { /* ... */ };
const dunFromLegacyFormat = (dun) => { /* ... */ };
const AI_NAMES = ['AI·关羽', 'AI·张飞', 'AI·赵云'];

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

  const resetToLobby = () => { /* ... (无变化) ... */ };

  const startTryPlay = () => { /* ... (无变化, 但请确保它调用的是下面更新后的函数) ... */ };
  
  const handleSelectCard = (card) => { /* ... (无变化) ... */ };

  // [修改] 使用从 cardUtils 导入的权威 isFoul 函数
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

  const handleSubmitDun = () => { /* ... (无变化) ... */ };
  
  const handleSmartSplit = () => {
    // ...
    // [修改] 使用权威 isFoul
    const duns = dunFromLegacyFormat(splitResultLegacy);
    setGameState(prev => ({
        ...prev,
        tempDuns: duns,
        isFoul: checkIsFoul(duns.dun1, duns.dun2, duns.dun3),
    }));
    // ...
  };

  const handleResetGame = () => { /* ... (无变化) ... */ };

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
