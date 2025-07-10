// src/components/game/PokerTable.js

import React from 'react';
import Card from '../ui/Card';
import '../../styles/PokerTable.css';
import { getHandType } from '../../utils/game/cardUtils';

const PokerTable = ({ gameState, playerIdx, msg, onResetGame, onSubmitDun, onSmartSplit, onExit, onSelectCard, onMoveToDun }) => {
  if (!gameState || !gameState.players || gameState.players.length === 0 || playerIdx === null) {
    return <div className="poker-table-loading">正在等待游戏开始...</div>;
  }
  
  const myPlayer = gameState.players[playerIdx];
  if (!myPlayer) {
    return <div className="poker-table-loading">正在加载玩家数据...</div>;
  }

  const tempDuns = gameState.tempDuns || { dun1: [], dun2: [], dun3: [] };
  const allocatedCards = Object.values(tempDuns).flat();
  const unallocatedHand = (myPlayer.hand || []).filter(c => !allocatedCards.includes(c));
  const selectedCards = gameState.selectedCards || [];
  
  const isMyTurn = gameState.status === 'playing' && myPlayer.dun === null;

  const renderDun = (dun, dunName, label) => {
    const currentDun = dun || []; // 防御 undefined
    const handType = getHandType(currentDun);

    return (
      <div className={`dun-area ${dunName}`} onClick={() => isMyTurn && onMoveToDun(dunName)}>
        <div className="dun-label">
          {/* [防御性渲染] 确保渲染的是字符串和数字 */}
          {String(label)} ({currentDun.length})
          {currentDun.length > 0 && <div className="hand-type-label">{String(handType)}</div>}
        </div>
        <div className="dun-cards">
          {currentDun.map(card => 
              <Card 
                  key={String(card)} 
                  card={String(card)} 
                  isSelected={selectedCards.includes(card)} 
                  onCardClick={isMyTurn ? onSelectCard : null}
              />
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="poker-table-container">
       <div className="table-header">
        <button onClick={onExit} className="exit-button">返回大厅</button>
        {/* [防御性渲染] 确保 msg 是字符串 */}
        <div className={`game-msg ${gameState.isFoul ? 'foul-warning-text' : ''}`}>{String(msg)}</div>
      </div>

      {/* ... 其他玩家区域 ... */}

      <div className="my-player-area">
        {isMyTurn ? (
          <>
            <div className="my-hand-area">
              <h3>未分配手牌 ({unallocatedHand.length})</h3>
              <div className="hand-cards">
                {unallocatedHand.map(card => 
                  <Card 
                    key={String(card)} 
                    card={String(card)} 
                    isSelected={selectedCards.includes(card)} 
                    onCardClick={onSelectCard}
                  />
                )}
              </div>
            </div>
            
            <div className="my-duns-area">
              <h3>我的牌墩 (点击区域放置选中的牌)</h3>
              {renderDun(tempDuns.dun1, 'dun1', '头道')}
              {renderDun(tempDuns.dun2, 'dun2', '中道')}
              {renderDun(tempDuns.dun3, 'dun3', '尾道')}
            </div>
          </>
        ) : (
          myPlayer.dun &&
            <div className="my-duns-area">
              <h3>我的最终牌型</h3>
              {renderDun(myPlayer.dun.dun1, 'dun1', '头道')}
              {renderDun(myPlayer.dun.dun2, 'dun2', '中道')}
              {renderDun(myPlayer.dun.dun3, 'dun3', '尾道')}
            </div>
        )}
      </div>
      
      <div className="controls-area">
        {isMyTurn && (
          <>
            <button onClick={onSmartSplit} disabled={!isMyTurn}>智能理牌</button>
            <button onClick={onSubmitDun} disabled={!isMyTurn}>提交理牌</button>
          </>
        )}
        {gameState.status === 'finished' && (
          <button onClick={onResetGame}>再来一局</button>
        )}
      </div>
    </div>
  );
};

export default PokerTable;
