// src/components/game/PokerTable.js

import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import '../../styles/PokerTable.css';
import { getHandType } from '../../utils/game/cardUtils';

const PokerTable = ({ gameState, playerIdx, msg, onResetGame, onSubmitDun, onSmartSplit, onExit, onSelectCard, onMoveToDun }) => {
  const [showResultModal, setShowResultModal] = useState(false);

  useEffect(() => {
    // [修改] 只有在游戏状态变为 'finished' 时才显示弹窗
    if (gameState.status === 'finished' && !showResultModal) {
      setShowResultModal(true);
    }
  }, [gameState.status, showResultModal]);

  if (!gameState || !gameState.players || gameState.players.length === 0 || playerIdx === null) {
    return <div className="poker-table-loading">正在等待游戏开始...</div>;
  }
  
  const myPlayer = gameState.players[playerIdx];
  if (!myPlayer) {
    return <div className="poker-table-loading">正在加载玩家数据...</div>;
  }

  const isMyTurn = gameState.status === 'playing' && myPlayer.dun === null;
  const isComparing = gameState.status === 'comparing';
  
  // --- 渲染逻辑函数 ---
  
  // 渲染单个牌墩 (内部使用)
  const renderSingleDun = ({ dunCards, dunName, label, isInteractive, selectedCards, revealed }) => {
    const handType = getHandType(dunCards);
    return (
      <div className={`dun-area ${dunName}`} onClick={() => isInteractive && onMoveToDun(dunName)}>
        <div className="dun-label">
          {label} ({(dunCards || []).length})
          {(dunCards || []).length > 0 && <div className="hand-type-label">{handType}</div>}
        </div>
        <div className="dun-cards">
          {(dunCards || []).map(card => 
            // [修改] 在比牌中且未翻开时显示牌背
            isComparing && !revealed ? (
              <div key={card} className="card-back" />
            ) : (
              <Card 
                  key={card} 
                  card={card} 
                  isSelected={(selectedCards || []).includes(card)} 
                  onCardClick={isInteractive ? onSelectCard : null}
              />
            )
          )}
        </div>
      </div>
    );
  };
  
  // [修改] 渲染最终结果弹窗
  const renderResultModal = () => {
    if (!showResultModal) return null;
    return (
        <div className="results-overlay">
            <div className="results-modal">
                <h2>最终得分</h2>
                {gameState.players.map((p, index) => (
                    <div key={index} className="result-player">
                        <p>{p.name}: {gameState.scores[index]}</p>
                    </div>
                ))}
                <button onClick={() => {
                    setShowResultModal(false);
                    onResetGame();
                }}>再来一局</button>
            </div>
        </div>
    );
  };

  // --- 主渲染 JSX ---
  
  const allocatedCards = Object.values(gameState.tempDuns || {}).flat();
  const unallocatedHand = (myPlayer.hand || []).filter(c => !allocatedCards.includes(c));

  return (
    <div className="poker-table-container">
       <div className="table-header">
        <button onClick={onExit} className="exit-button">返回大厅</button>
        <div className={`game-msg ${gameState.isFoul ? 'foul-warning-text' : ''}`}>{msg}</div>
      </div>

      <div className="main-view">
        {isMyTurn ? (
          // --- 视图 1: 玩家理牌中 ---
          <div className="my-player-area">
            {/* ... (理牌视图无变化) ... */}
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
              {renderSingleDun({ dunCards: gameState.tempDuns.dun1, dunName: 'dun1', label: '头道', isInteractive: true, selectedCards: gameState.selectedCards })}
              {renderSingleDun({ dunCards: gameState.tempDuns.dun2, dunName: 'dun2', label: '中道', isInteractive: true, selectedCards: gameState.selectedCards })}
              {renderSingleDun({ dunCards: gameState.tempDuns.dun3, dunName: 'dun3', label: '尾道', isInteractive: true, selectedCards: gameState.selectedCards })}
            </div>
          </div>
        ) : (
          // --- 视图 2: 等待、比牌、结束状态 ---
          <div className="all-players-view">
            <h3>牌局总览</h3>
            {gameState.players.map((player, index) => (
              <div key={index} className="player-table">
                <div className="player-table-header">
                  <span className="player-name">{player.name} {index === playerIdx ? '(你)' : ''}</span>
                  {/* [修改] 显示比牌过程中的临时分数 */}
                  {isComparing && (
                    <span className="player-score-interim">
                       得分: {gameState.comparisonState.interimScores[index] || 0}
                    </span>
                  )}
                </div>
                {player.dun ? (
                  <div className="player-duns-final">
                    {/* [修改] 传递 revealed 状态 */}
                    {renderSingleDun({ dunCards: player.dun.dun3, dunName: 'dun3', label: '尾道', isInteractive: false, revealed: gameState.comparisonState.revealedDuns.includes('dun3') })}
                    {renderSingleDun({ dunCards: player.dun.dun2, dunName: 'dun2', label: '中道', isInteractive: false, revealed: gameState.comparisonState.revealedDuns.includes('dun2') })}
                    {renderSingleDun({ dunCards: player.dun.dun1, dunName: 'dun1', label: '头道', isInteractive: false, revealed: gameState.comparisonState.revealedDuns.includes('dun1') })}
                  </div>
                ) : (
                  <div className="player-waiting-placeholder">等待 {player.name} 理牌...</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="controls-area">
        {isMyTurn && <button onClick={onSmartSplit}>智能理牌</button>}
        {isMyTurn && <button onClick={onSubmitDun}>提交理牌</button>}
        {gameState.status === 'finished' && <button onClick={() => { setShowResultModal(false); onResetGame(); }}>再来一局</button>}
      </div>

      {renderResultModal()}
    </div>
  );
};

export default PokerTable;