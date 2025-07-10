// src/components/game/PokerTable.js

import React, { useState, useEffect } from 'react'; // [修改] 引入 useState 和 useEffect
import Card from '../ui/Card';
import '../../styles/PokerTable.css';
import { getHandType } from '../../utils/game/cardUtils';

const PokerTable = ({ gameState, playerIdx, msg, onResetGame, onSubmitDun, onSmartSplit, onExit, onSelectCard, onMoveToDun }) => {
  // [新增] 本地 state，用于控制结果弹窗的显示/隐藏
  const [showResultModal, setShowResultModal] = useState(false);

  // [新增] 使用 useEffect 来监听游戏状态，当游戏结束时自动弹出结果窗口
  useEffect(() => {
    if (gameState.status === 'finished') {
      setShowResultModal(true);
    }
  }, [gameState.status]);

  if (!gameState || !gameState.players || gameState.players.length === 0 || playerIdx === null) {
    return <div className="poker-table-loading">正在等待游戏开始...</div>;
  }
  
  const myPlayer = gameState.players[playerIdx];
  if (!myPlayer) {
    return <div className="poker-table-loading">正在加载玩家数据...</div>;
  }

  const isMyTurn = gameState.status === 'playing' && myPlayer.dun === null;
  const isComparing = gameState.status === 'comparing';

  const renderDun = (dun, dunName, label, isInteractive) => {
    // ... renderDun 函数的内部逻辑保持不变
  };

  const renderPlayerTable = (player, pIndex) => {
    // ... renderPlayerTable 函数的内部逻辑保持不变
  };

  // [新增] 渲染最终结果弹窗的函数
  const renderResultModal = () => {
    if (gameState.status !== 'finished') return null;

    const renderPlayerResult = (player, index) => {
      const score = gameState.scores[index];
      const scoreClass = score > 0 ? 'win' : score < 0 ? 'lose' : '';
      
      return (
        <div key={index} className="result-player">
          <div className="result-player-header">
            <span className="player-name">{player.name} {index === playerIdx ? '(你)' : ''}</span>
            <span className={`player-score ${scoreClass}`}>
              {score > 0 ? `+${score}` : score}分
            </span>
          </div>
          {player.dun && Object.keys(player.dun).map(dunKey => (
            <div key={dunKey} className="result-player-dun">
              <div className="dun-label">
                {dunKey === 'dun1' ? '头道' : dunKey === 'dun2' ? '中道' : '尾道'}:
                <span className="hand-type-label" style={{display: 'block'}}>
                    {getHandType(player.dun[dunKey])}
                </span>
              </div>
              <div className="dun-cards">
                {player.dun[dunKey].map(card => <Card key={card} card={card} />)}
              </div>
            </div>
          ))}
        </div>
      );
    };

    return (
      <div className={`result-modal-overlay ${showResultModal ? 'visible' : ''}`}>
        <div className="result-modal">
          <button className="close-modal-button" onClick={() => setShowResultModal(false)}>×</button>
          <h2>比牌结果</h2>
          <div className="result-players-container">
            {gameState.players.map(renderPlayerResult)}
          </div>
          <div className="result-modal-controls">
            <button onClick={onResetGame}>再来一局</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="poker-table-container">
       <div className="table-header">
        <button onClick={onExit} className="exit-button">返回大厅</button>
        <div className={`game-msg ${gameState.isFoul ? 'foul-warning-text' : ''}`}>{msg}</div>
      </div>

      <div className="main-view">
        {isMyTurn ? (
          // 理牌视图
          <div className="my-player-area">
            {/* ... 理牌视图的JSX (无变化) ... */}
          </div>
        ) : (
          // 等待、比牌、结束状态都显示所有玩家的牌桌
          <div className="comparison-area">
            {gameState.players.map((p, i) => {
              if (!p || !p.dun) return <div key={i} className="player-status-waiting">{p.name} 等待中...</div>;
              
              const isRevealed = (dunName) => gameState.comparisonState.revealedDuns.includes(dunName);
              
              return (
                <div key={i} className="player-table">
                  <h4>{p.name} {i === playerIdx ? '(你)' : ''}</h4>
                  {['dun1', 'dun2', 'dun3'].map((dunName, dunIndex) => (
                      <div key={dunName} className="dun-area">
                          <div className="dun-cards">
                              {(p.dun[dunName] || []).map(card => 
                                isComparing && !isRevealed(dunName) 
                                ? <div key={card} className="card-back" />
                                : <Card key={card} card={card} />
                              )}
                          </div>
                          {isComparing && <div className={`dun-result-overlay ...`}>...</div>}
                      </div>
                  ))}
                </div>
              )
            })}
          </div>
        )}
      </div>
      
      <div className="controls-area">
        {isMyTurn && <button onClick={onSmartSplit}>智能理牌</button>}
        {isMyTurn && <button onClick={onSubmitDun}>提交理牌</button>}
        {gameState.status === 'finished' && <button onClick={onResetGame}>再来一局</button>}
      </div>

      {/* [新增] 在最外层渲染弹窗 */}
      {renderResultModal()}
    </div>
  );
};

export default PokerTable;
