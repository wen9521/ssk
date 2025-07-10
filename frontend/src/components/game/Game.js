// src/components/game/Game.js

import React, { useState, useEffect } from 'react';
import { getCardImageUrl } from '../../utils/game/cardImage';
import { convertCompactToVerbose } from '../../utils/game/cardUtils'; // 导入转换函数
import '../../styles/Game.css';

const OUTER_MAX_WIDTH = 420;
const PAI_DUN_HEIGHT = 133;
const CARD_HEIGHT = Math.round(PAI_DUN_HEIGHT * 0.94);
const CARD_WIDTH = Math.round(CARD_HEIGHT * 46 / 66);

const Game = ({
  gameState,
  isReady,
  onReady,
  onCardClick,
  onMoveTo,
  onSmartSplit,
  onStartCompare,
  onExit,
}) => {
  const {
    msg, status, players, tempDuns, scores, foulStates, hasCompared, selected, comparison
  } = gameState;

  const [showResult, setShowResult] = useState(false);
  
  useEffect(() => {
    if (status === 'finished') {
      setShowResult(true);
    } else {
      setShowResult(false);
    }
  }, [status]);

  const isComparing = status === 'comparing' || status === 'finished';

  function renderPlayerSeat(player, idx) {
    const isMe = player.name === '你';
    const seatClass = isMe ? 'play-seat me' : `play-seat ai ${player.processed ? 'ready' : ''}`;
    
    let scoreToShow = '';
    // Use interim scores during comparison, final scores when finished
    if (status === 'comparing' && comparison.interimScores.length > idx) {
        scoreToShow = `得分: ${comparison.interimScores[idx]}`;
    } else if (status === 'finished' && scores.length > idx) {
        scoreToShow = `总分: ${scores[idx]}`;
    }

    return (
      <div key={player.name} className={seatClass}>
        <div>{player.name}</div>
        <div className="play-seat-status">
          {!isMe && (player.processed ? '已理牌' : '理牌中…')}
          {scoreToShow && <div className="interim-score">{scoreToShow}</div>}
        </div>
      </div>
    );
  }

  function renderPaiDunCards(arr, area, cardSize, isRevealed = true) {
    const paddingX = 16;
    const maxWidth = OUTER_MAX_WIDTH - 2 * paddingX - 70;
    let overlap = Math.floor((cardSize?.width ?? CARD_WIDTH) / 3);
    if (arr.length > 1) {
      const totalWidth = (cardSize?.width ?? CARD_WIDTH) + (arr.length - 1) * overlap;
      if (totalWidth > maxWidth) overlap = Math.floor((maxWidth - (cardSize?.width ?? CARD_WIDTH)) / (arr.length - 1));
    }
    const lefts = arr.map((_, i) => i * overlap);
    
    return (
      <div className="dun-card-area" style={{ height: cardSize?.height ?? PAI_DUN_HEIGHT }}>
        {arr.map((card, idx) => {
          const isSelected = selected.area === area && selected.cards.includes(card);
          const topPosition = ((cardSize?.height ?? PAI_DUN_HEIGHT) - (cardSize?.height ?? CARD_HEIGHT)) / 2;
          
          if (!isRevealed) {
            return <div key={idx} className="card-back" style={{ left: lefts[idx], top: topPosition, width: cardSize?.width ?? CARD_WIDTH, height: cardSize?.height ?? CARD_HEIGHT }} />;
          }

          return (
            <img
              key={card} src={getCardImageUrl(card)} alt={card}
              className={`card-img ${isSelected ? 'selected' : ''}`}
              style={{
                left: lefts[idx], top: topPosition, zIndex: idx,
                width: cardSize?.width ?? CARD_WIDTH, height: cardSize?.height ?? CARD_HEIGHT,
              }}
              onClick={e => { if (isReady && status === 'playing') { e.stopPropagation(); onCardClick(card, area); } }}
              draggable={false}
            />
          );
        })}
      </div>
    );
  }
  
  function renderPaiDun(arr, label, area, isInteractive, isRevealed = true) {
    return (
      <div className="dun-container" onClick={() => { if (isInteractive) onMoveTo(area); }}>
        <div className="dun-cards-wrapper">
          {arr.length === 0 
            ? <div className="dun-placeholder">请放置</div>
            : renderPaiDunCards(arr, area, null, isRevealed)
          }
        </div>
        <div className="dun-label">{label}（{arr.length}）</div>
      </div>
    );
  }
  
  function renderResultModal() {
    if (!showResult) return null;
    const allFinalDuns = status==='finished' ? players : [];
    return (
      <div className="result-modal-overlay">
        <div className="result-modal">
          <div className="result-grid">
            {allFinalDuns.map((p, i) => (
              <div key={i} className="result-player-display">
                <div className={`result-player-name ${p.name === '你' ? 'me' : 'ai'}`}>
                  {p.name}
                  {foulStates[i] && <span className="foul-text">（倒水）</span>}
                   (总分: {scores[i]})
                </div>
                 <div className="result-dun-row">{renderPaiDunCards(p.dun.dun1, 'none', {width:37, height:55})}</div>
                 <div className="result-dun-row">{renderPaiDunCards(p.dun.dun2, 'none', {width:37, height:55})}</div>
                 <div className="result-dun-row">{renderPaiDunCards(p.dun.dun3, 'none', {width:37, height:55})}</div>
              </div>
            ))}
          </div>
          <div className="result-modal-actions">
            <button onClick={onReady} className="control-button ready-button">再来一局</button>
            <button onClick={onExit} className="control-button cancel-button">返回大厅</button>
          </div>
        </div>
      </div>
    );
  }

  const handleSmartSplitClick = () => {
    // 收集 tempDuns 中所有13张牌（它们是紧凑型格式）
    const allCurrentCardsCompact = [
      ...tempDuns.head,
      ...tempDuns.middle,
      ...tempDuns.tail
    ];

    // 将它们转换为 SmartSplit.js 所需的详细格式
    const allCurrentCardsVerbose = allCurrentCardsCompact.map(card => convertCompactToVerbose(card));

    // 调用 onSmartSplit prop，并传入详细格式的牌
    if (onSmartSplit && isReady) {
      onSmartSplit(allCurrentCardsVerbose);
    }
  };

  return (
    <div className="game-container-background">
      <div className="game-outer-container">
        <div className="game-header">
          <button className="exit-button" onClick={onExit}>&lt; 退出房间</button>
          <div className="score-display"><span role="img" aria-label="coin">🪙</span> 积分：100</div>
        </div>
        
        {isComparing ? (
            <div className="comparison-view">
                {players.map((p, i) => (
                    <div className="player-comparison-area" key={i}>
                        {renderPlayerSeat(p, i)}
                        {renderPaiDun(p.dun.dun3, '尾道', 'tail', false, comparison.revealedDuns.includes('tail'))}
                        {renderPaiDun(p.dun.dun2, '中道', 'middle', false, comparison.revealedDuns.includes('middle'))}
                        {renderPaiDun(p.dun.dun1, '头道', 'head', false, comparison.revealedDuns.includes('head'))}
                    </div>
                ))}
            </div>
        ) : (
            <>
                <div className="player-seats-container">
                    {/* Placeholder for 'You' before your data is in the players array */}
                    {players.find(p => p.name === '你') 
                      ? players.map((p, i) => renderPlayerSeat(p,i))
                      : [renderPlayerSeat({name: '你', processed: isReady}, 0), ...players.map((ai, idx) => renderPlayerSeat(ai, idx + 1))]
                    }
                </div>
                {renderPaiDun(tempDuns.head, '头道', 'head', true)}
                {renderPaiDun(tempDuns.middle, '中道', 'middle', true)}
                {renderPaiDun(tempDuns.tail, '尾道', 'tail', true)}
            </>
        )}

        <div className="controls-container">
          <button className={`control-button ${isReady ? 'cancel-button' : 'ready-button'}`} onClick={onReady}>
            {isReady ? '取消准备' : '开始游戏'}
          </button>
          <button className="control-button smart-split-button" onClick={handleSmartSplitClick} disabled={!isReady}>
            智能分牌
          </button>
          <button className="control-button compare-button" onClick={onStartCompare} disabled={!isReady || !players.every(p => p.processed)}>
            开始比牌
          </button>
        </div>
        <div className="message-area">{msg}</div>
        {renderResultModal()}
      </div>
    </div>
  );
};

export default Game;
