import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ThirteenWater.css'; // Import custom styles

const ThirteenWater = () => {
  const navigate = useNavigate();

  const handleStartGame = () => {
    navigate('/thirteen-water/play');
  };

  const handleBackToLobby = () => {
    navigate('/');
  };

  return (
    <div className="thirteen-water-container">
      <div className="thirteen-water-header">
        <h1>欢迎来到十三水</h1>
        <p>一款策略与运气并存的经典扑克游戏</p>
      </div>

      <div className="thirteen-water-rules">
        <h2>游戏规则简介</h2>
        <ul>
          <li><strong>目标：</strong>将13张手牌排列成三墩（前、中、后），并与其他玩家比较大小。</li>
          <li><strong>墩位：</strong>前墩3张，中墩5张，后墩5张。</li>
          <li><strong>牌型要求：</strong>后墩牌型必须大于或等于中墩，中墩必须大于或等于前墩。</li>
          <li><strong>特殊牌型：</strong>拥有“一条龙”、“三同花顺”等特殊牌型可获得额外加分。</li>
        </ul>
      </div>

      <div className="thirteen-water-how-to-play">
        <h2>如何开始</h2>
        <ol>
          <li>点击“开始游戏”进入对局。</li>
          <li>系统将为您自动发13张牌。</li>
          <li>在规定时间内，将手牌拖拽或点击分配到前、中、后三墩。</li>
          <li>确认无误后，点击“完成理牌”按钮，等待与其他玩家开牌比对。</li>
        </ol>
      </div>

      <div className="thirteen-water-actions">
        <button className="start-game-btn" onClick={handleStartGame}>
          开始游戏
        </button>
        <button className="back-to-lobby-btn" onClick={handleBackToLobby}>
          返回大厅
        </button>
      </div>
    </div>
  );
};

export default ThirteenWater;
