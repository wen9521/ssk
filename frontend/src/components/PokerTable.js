// frontend/src/components/PokerTable.js

import React from 'react';
import Hand from './Hand';
import ArrangeArea from './ArrangeArea';
import './Play.css'; // 假设您有这个CSS文件

const PokerTable = ({ 
  isTryPlay,
  gameState, 
  playerIdx, 
  onSubmitDun, 
  onStartGame, 
  onResetGame,
  msg 
}) => {
  const myPlayer = gameState.players[playerIdx] || {};
  const showArrangeArea = myPlayer.hand?.length === 13 && !myPlayer.dun;

  const getPlayerName = (index) => {
    if (index.toString() === playerIdx) {
      return `你 (${isTryPlay ? '试玩' : `座位${index}`})`;
    }
    return isTryPlay ? `AI ${index}` : `玩家 ${index}`;
  };

  return (
    <div style={{ padding: 20, maxWidth: '800px', margin: 'auto', fontFamily: 'sans-serif' }}>
      <h3>游戏桌</h3>
      <div style={{ color: "blue", minHeight: '20px', marginBottom: '10px' }}>{msg}</div>
      
      {!isTryPlay && playerIdx === '0' && gameState.status === 'waiting' && (
        <button onClick={onStartGame} disabled={gameState.players.length < 2}>
          发牌 (当前 {gameState.players.length} 人)
        </button>
      )}

      {gameState.status === 'finished' && (
         <button onClick={onResetGame}>再来一局</button>
      )}

      <hr />
      
      <h4>玩家列表与牌墩</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {gameState.players.map((p, idx) => (
          <div key={`player-${idx}`} style={{ border: idx.toString() === playerIdx ? '2px solid gold' : '1px solid #ccc', padding: '10px', borderRadius: '8px' }}>
            <b>{getPlayerName(idx)}:</b>
            {p.dun ? (
              <div>
                <div>头墩: <Hand hand={p.dun.dun1} /></div>
                <div>中墩: <Hand hand={p.dun.dun2} /></div>
                <div>尾墩: <Hand hand={p.dun.dun3} /></div>
                {gameState.scores && <div style={{fontWeight: 'bold'}}>得分: {gameState.scores[idx]}</div>}
              </div>
            ) : (
              <span>
                {p.hand?.length > 0 ? '等待理牌...' : '等待中...'}
              </span>
            )}
          </div>
        ))}
      </div>

      {showArrangeArea && (
        <div>
          <hr style={{ margin: '20px 0' }} />
          <h3>请理牌</h3>
          <ArrangeArea hand={myPlayer.hand} onSubmit={onSubmitDun} />
        </div>
      )}
    </div>
  );
};

export default PokerTable;
