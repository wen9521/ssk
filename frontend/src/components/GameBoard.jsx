import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toCardFilename } from '../utils/card-utils'; // 导入工具函数
import './Play.css';

const GameBoard = ({
  head,
  middle,
  tail,
  selected,
  msg,
  aiPlayers,
  showResult,
  scores,
  isReady,
  hasCompared,
  foulStates,
  aiProcessed,
  handleReady,
  handleCardClick,
  moveTo,
  handleSmartSplit,
  handleStartCompare,
  setShowResult,
}) => {
  const navigate = useNavigate();

  const renderPlayerSeat = (name, idx, isMe) => {
    const aiDone = idx > 0 ? aiProcessed[idx - 1] : false;
    const playerClass = isMe ? 'player-me' : (aiDone ? 'player-ready' : 'player-waiting');
    const statusText = isMe ? '你' : (aiDone ? '已理牌' : '理牌中…');
    return (
      <div key={name} className={`player-seat ${playerClass}`}>
        <div className="player-name">{name}</div>
        <div className="player-status">{statusText}</div>
      </div>
    );
  };

  const renderPaiDunCards = (cards, area, isResult = false) => {
    return (
      <div className={`card-container ${isResult ? 'result-card-container' : ''}`}>
        {cards.map((card, idx) => {
          const isSelected = selected.area === area && selected.cards.includes(card);
          const cardFilename = toCardFilename(card); // 使用工具函数转换卡牌名称
          return (
            <img
              key={card}
              src={`/assets/cards/${cardFilename}.svg`} // 更新图片路径
              alt={card}
              className={`card-img ${isSelected ? 'selected' : ''}`}
              style={{ zIndex: idx, left: `calc(var(--card-overlap) * ${idx})` }}
              onClick={(e) => { if (isReady && !isResult) handleCardClick(card, area, e); }}
              draggable={false}
            />
          );
        })}
      </div>
    );
  };

  const renderPaiDun = (cards, label, area) => {
    return (
      <div className="pai-dun" onClick={() => { if (isReady) moveTo(area); }}>
        <div className="pai-dun-content">
          {cards.length === 0 ? <div className="pai-dun-placeholder">请放置</div> : renderPaiDunCards(cards, area)}
        </div>
        <div className="pai-dun-label">{label} ({cards.length})</div>
      </div>
    );
  };

  const renderResultModal = () => {
    if (!showResult) return null;
    return (
      <div className="modal-overlay" onClick={() => setShowResult(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <button className="modal-close-btn" onClick={() => setShowResult(false)}>×</button>
          <div className="result-grid">
            {[
              { name: '你', head, middle, tail, score: scores[0], foul: foulStates[0] },
              ...aiPlayers.map((p, i) => ({ ...p, score: scores[i+1], foul: foulStates[i+1] }))
            ].map((p, i) => (
              <div key={i} className="result-player-summary">
                <div className={`result-player-name ${i === 0 ? 'me' : ''}`}>
                  {p.name}
                  {p.foul && <span className="foul-tag">（倒水）</span>}
                  <span className="score-tag">（{p.score}分）</span>
                </div>
                <div className="result-hands">
                  {renderPaiDunCards(p.head, 'none', true)}
                  {renderPaiDunCards(p.middle, 'none', true)}
                  {renderPaiDunCards(p.tail, 'none', true)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="game-container">
      <div className="game-board">
        <header className="game-header">
          <button className="btn btn-quit" onClick={() => navigate('/')}>
            &lt; 退出房间
          </button>
          <div className="game-score">
            <span role="img" aria-label="coin">🪙</span>
            积分：100
          </div>
        </header>

        <section className="players-section">
          {renderPlayerSeat('你', 0, true)}
          {aiPlayers.map((ai, idx) => renderPlayerSeat(ai.name, idx + 1, false))}
        </section>

        <section className="pai-dun-section">
          {renderPaiDun(head, '头道', 'head')}
          {renderPaiDun(middle, '中道', 'middle')}
          {renderPaiDun(tail, '尾道', 'tail')}
        </section>

        <footer className="game-footer">
          <button className="btn btn-action" onClick={handleReady} disabled={hasCompared}>
            {isReady ? '取消准备' : '准备'}
          </button>
          <button className="btn btn-action btn-smart" onClick={handleSmartSplit} disabled={!isReady}>
            智能分牌
          </button>
          <button className="btn btn-action btn-compare" onClick={handleStartCompare} disabled={!isReady || aiProcessed.some(p => !p)}>
            开始比牌
          </button>
        </footer>

        <div className="message-area">{msg}</div>
      </div>
      {renderResultModal()}
    </div>
  );
};

export default GameBoard;
