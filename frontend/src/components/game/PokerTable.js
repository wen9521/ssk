// [重构] 这是一个纯视图组件，它没有自己的 state，所有数据和操作都来自 props。
import React from 'react';
import Card from '../ui/Card';
import '../../styles/PokerTable.css'; // 引入组件专属样式

const PokerTable = ({ gameState, playerIdx, msg, onResetGame, onSubmitDun, onSmartSplit, onExit }) => {
  // [重构] 没有内部 state，直接从 gameState 中获取所有需要渲染的数据
  const myPlayer = gameState.players ? gameState.players[playerIdx] : null;
  const otherPlayers = gameState.players ? gameState.players.filter((_, i) => i !== playerIdx) : [];

  // [重构] 如果 gameState 不存在或玩家数据不存在，显示加载中或错误状态
  if (!gameState || !myPlayer) {
    return <div className="poker-table-loading">正在加载游戏...</div>;
  }

  const isMyTurn = gameState.status === 'playing' && myPlayer.dun === null;
  const allPlayersReadyForCompare = gameState.players.every(p => p.dun !== null);

  const renderDun = (dun, dunName) => (
    <div className={`dun-area ${dunName}`}>
      <div className="dun-label">{dunName} ({dun.length})</div>
      <div className="dun-cards">
        {dun.map(card => <Card key={card} card={card} />)}
      </div>
    </div>
  );

  return (
    <div className="poker-table-container">
      <div className="table-header">
        <button onClick={onExit} className="exit-button">返回大厅</button>
        <div className="game-msg">{msg}</div>
      </div>

      {/* [重构] 渲染其他玩家状态 */}
      <div className="other-players-area">
        {otherPlayers.map(p => (
          <div key={p.name} className={`player-status ${p.dun ? 'ready' : ''}`}>
            <div className="player-name">{p.name}</div>
            <div className="player-state">{p.dun ? '已理牌' : '理牌中...'}</div>
          </div>
        ))}
      </div>

      {/* [重构] 渲染游戏结果 */}
      {gameState.status === 'finished' && (
         <div className="results-overlay">
            <div className="results-modal">
              <h2>比牌结果</h2>
              {gameState.players.map((p, index) => (
                  <div key={index} className="result-player">
                      <p>{p.name} (得分: {gameState.scores[index]})</p>
                      {/* 在这里可以渲染每个玩家的牌 */}
                  </div>
              ))}
              <button onClick={onResetGame}>再来一局</button>
            </div>
         </div>
      )}


      {/* [重构] 渲染自己的手牌和理牌区 */}
      <div className="my-player-area">
        <div className="my-hand-area">
          <h3>你的手牌 ({myPlayer.hand.length})</h3>
          <div className="hand-cards">
            {myPlayer.hand.map(card => <Card key={card} card={card} isSelectable={isMyTurn} />)}
          </div>
        </div>
        
        {/*
          [说明] 理牌交互逻辑 (拖拽或点击选择) 需要在这里实现，
          并通过回调函数通知 App.js 来更新 gameState。
          为了简化，这里暂时只显示AI理好的牌。
        */}
        {myPlayer.dun && (
          <div className="my-duns-area">
            {renderDun(myPlayer.dun.dun1, '头道')}
            {renderDun(myPlayer.dun.dun2, '中道')}
            {renderDun(myPlayer.dun.dun3, '尾道')}
          </div>
        )}
      </div>

      {/* [重构] 控制按钮区域 */}
      <div className="controls-area">
        {gameState.status === 'playing' && (
          <>
            <button onClick={onSmartSplit} disabled={!isMyTurn}>智能理牌</button>
            <button onClick={onSubmitDun} disabled={!isMyTurn || !allPlayersReadyForCompare}>提交理牌</button>
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