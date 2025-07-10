// src/components/game/PokerTable.js

import React from 'react';
import Card from '../ui/Card';
import '../../styles/PokerTable.css';
import { getHandType } from '../../utils/game/cardUtils'; // [新增] 导入牌型判断函数

const PokerTable = ({ gameState, playerIdx, msg, onResetGame, onSubmitDun, onSmartSplit, onExit, onSelectCard, onMoveToDun }) => {
  // 安全性检查，防止 gameState 或 playerIdx 无效时崩溃
  if (!gameState || !gameState.players || gameState.players.length === 0 || playerIdx === null) {
    return <div className="poker-table-loading">正在等待游戏开始...</div>;
  }
  
  const myPlayer = gameState.players[playerIdx];
  if (!myPlayer) {
    return <div className="poker-table-loading">正在加载玩家数据...</div>;
  }

  // 计算未分配的手牌
  const allocatedCards = Object.values(gameState.tempDuns || {}).flat();
  const unallocatedHand = (myPlayer.hand || []).filter(c => !allocatedCards.includes(c));
  
  const isMyTurn = gameState.status === 'playing' && myPlayer.dun === null;

  // [修改] 牌墩渲染函数，增加牌型显示
  const renderDun = (dun, dunName, label) => {
    // 实时计算牌型
    const handType = getHandType(dun);

    return (
      <div className={`dun-area ${dunName}`} onClick={() => isMyTurn && onMoveToDun(dunName)}>
        <div className="dun-label">
          {label} ({dun.length})
          {/* 当有牌时才显示牌型 */}
          {dun.length > 0 && <div className="hand-type-label">{handType}</div>}
        </div>
        <div className="dun-cards">
          {dun.map(card => 
              <Card 
                  key={card} 
                  card={card} 
                  isSelected={(gameState.selectedCards || []).includes(card)} 
                  onCardClick={onSelectCard}
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
        {/* [修改] 增加倒水警告的特殊样式 */}
        <div className={`game-msg ${gameState.isFoul ? 'foul-warning-text' : ''}`}>{msg}</div>
      </div>

      {/* ... other players, results modal (无大变化) ... */}

      {/* 渲染自己的手牌和理牌区 */}
      <div className="my-player-area">
        {isMyTurn ? (
          <>
            <div className="my-hand-area">
              <h3>未分配手牌 ({unallocatedHand.length})</h3>
              <div className="hand-cards">
                {unallocatedHand.map(card => 
                  <Card 
                    key={card} 
                    card={card} 
                    isSelected={(gameState.selectedCards || []).includes(card)} 
                    onCardClick={onSelectCard}
                  />
                )}
              </div>
            </div>
            
            <div className="my-duns-area">
              <h3>我的牌墩 (点击区域放置选中的牌)</h3>
              {renderDun(gameState.tempDuns.dun1, 'dun1', '头道')}
              {renderDun(gameState.tempDuns.dun2, 'dun2', '中道')}
              {renderDun(gameState.tempDuns.dun3, 'dun3', '尾道')}
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
            <button onClick={onSmartSplit}>智能理牌</button>
            <button onClick={onSubmitDun}>提交理牌</button>
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
