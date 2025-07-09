jsx
import React from 'react';
import Hand from './Hand';
import ArrangeArea from './ArrangeArea';
import './Play.css';

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

  const getPlayerStatus = (player, index) => {
    if (!player.hand || player.hand.length === 0) return '等待中...';
    if (!player.dun) return '理牌中...';
    return '已完成';
  };

  return (
    <div className="play-container">
      <div className="game-message">{msg}</div>

      {/* 游戏控制按钮 */}
      <div className="game-controls">
        {!isTryPlay && playerIdx === '0' && gameState.status === 'waiting' && (
          <button onClick={onStartGame} disabled={gameState.players.length < 2}>
            开始游戏 ({gameState.players.length}/4)
          </button>
        )}

        {gameState.status === 'finished' && (
          <button onClick={onResetGame} style={{ backgroundColor: '#ff6b6b' }}>
            再来一局
          </button>
        )}
      </div>

      {/* 玩家状态指示器 */}
      <div className="player-status-indicator">
        {gameState.players.map((p, idx) => (
          <div
            key={`status-${idx}`}
            className={`player-status ${idx.toString() === playerIdx ? 'current' : ''} ${p.dun ? 'ready' : ''}`}
          >
            <span>{idx.toString() === playerIdx ? '你' : `玩家${idx}`}</span>
            <div className="status-dot"></div>
          </div>
        ))}
      </div>

      {/* 玩家牌墩展示 */}
      <div className="players-area">
        {gameState.players.map((p, idx) => (
          <div
            key={`player-${idx}`}
            className={`play-seat ${idx.toString() === playerIdx ? 'current' : ''}`}
          >
            <div className="player-header">
              <div className="player-name">
                {idx.toString() === playerIdx ?
                  `你 (${isTryPlay ? '试玩' : `座位${idx}`})` :
                  (isTryPlay ? `AI ${idx}` : `玩家 ${idx}`)
                }
              </div>
              <div className="player-status">{getPlayerStatus(p, idx)}</div>
            </div>

            {p.dun ? (
              <div className="player-duns">
                <div className="dun-section">
                  <div className="dun-label">头墩</div>
                  <Hand hand={p.dun.dun1} />
                </div>
                <div className="dun-section">
                  <div className="dun-label">中墩</div>
                  <Hand hand={p.dun.dun2} />
                </div>
                <div className="dun-section">
                  <div className="dun-label">尾墩</div>
                  <Hand hand={p.dun.dun3} />
                </div>
                {gameState.scores && (
                  <div className="player-score">得分: {gameState.scores[idx]}</div>
                )}
              </div>
            ) : (
              <div className="waiting-area">
                {p.hand?.length > 0 ? '理牌中...' : '等待加入...'}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 理牌区域 */}
      {showArrangeArea && (
        <div className="arrange-container">
          <ArrangeArea hand={myPlayer.hand} onSubmit={onSubmitDun} />
        </div>
      )}
    </div>
  );
};

export default PokerTable;