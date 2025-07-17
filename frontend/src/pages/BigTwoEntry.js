import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/BigTwoEntry.css'; // Import custom styles

const BigTwoEntry = () => {
  const navigate = useNavigate();

  const handleStartGame = () => {
    navigate('/big-two/play');
  };

  const handleBackToLobby = () => {
    navigate('/');
  };

  return (
    <div className="big-two-entry-container">
      <div className="big-two-entry-header">
        <h1>欢迎来到锄大地</h1>
        <p>一款紧张刺激、策略至上的经典扑克游戏</p>
      </div>

      <div className="big-two-entry-rules">
        <h2>游戏规则简介</h2>
        <ul>
          <li><strong>目标：</strong>最先将手中的牌全部打出的玩家获得胜利。</li>
          <li><strong>牌型大小：</strong>2 > A > K > Q > J > 10 > 9 > 8 > 7 > 6 > 5 > 4 > 3。</li>
          <li><strong>花色大小：</strong>黑桃(♠) > 红心(♥) > 梅花(♣) > 方块(♦)。</li>
          <li><strong>牌型：</strong>支持单张、对子、三条、顺子、同花、葫芦、金刚、同花顺等牌型。</li>
        </ul>
      </div>

      <div className="big-two-entry-how-to-play">
        <h2>如何开始</h2>
        <ol>
          <li>点击“开始游戏”进入对局。</li>
          <li>系统将为您和其他三名AI玩家发牌，每人13张。</li>
          <li>拥有方块3的玩家必须先出牌。</li>
          <li>轮到您时，打出比上一家大的牌，或选择“不出”。</li>
          <li>运用策略，率先出完所有手牌，成为赢家！</li>
        </ol>
      </div>

      <div className="big-two-entry-actions">
        <button className="start-game-btn" onClick={handleStartGame}>
          开始游戏 (vs. AI)
        </button>
        <button className="back-to-lobby-btn" onClick={handleBackToLobby}>
          返回大厅
        </button>
      </div>
    </div>
  );
};

export default BigTwoEntry;
