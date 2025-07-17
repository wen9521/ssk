import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/DouDiZhuEntry.css'; // Import custom styles

const DouDiZhuEntry = () => {
  const navigate = useNavigate();

  const handleStartGame = () => {
    navigate('/doudizhu/play');
  };

  const handleBackToLobby = () => {
    navigate('/');
  };

  return (
    <div className="doudizhu-entry-container">
      <div className="doudizhu-entry-header">
        <h1>欢迎来到斗地主</h1>
        <p>一款集策略、合作与对抗于一体的国民级扑克游戏</p>
      </div>

      <div className="doudizhu-entry-rules">
        <h2>游戏规则简介</h2>
        <ul>
          <li><strong>角色：</strong>一名“地主”对抗两名“农民”。</li>
          <li><strong>目标：</strong>地主率先出完所有牌即获胜；任一农民出完所有牌，则农民方获胜。</li>
          <li><strong>牌型：</strong>支持单张、对子、三带一、顺子、飞机、炸弹、王炸等经典牌型。</li>
          <li><strong>叫牌：</strong>玩家轮流叫地主，分值越高者成为地主，并获得三张底牌。</li>
        </ul>
      </div>

      <div className="doudizhu-entry-how-to-play">
        <h2>如何开始</h2>
        <ol>
          <li>点击“开始游戏”进入对局。</li>
          <li>系统将为您和其他两名AI玩家发牌。</li>
          <li>根据您的手牌强度，进行“叫地主”或“不叫”的选择。</li>
          <li>成为地主或农民后，在您的回合，打出合规的牌型压过上家，或选择“不出”。</li>
          <li>率先出完手牌，赢取胜利！</li>
        </ol>
      </div>

      <div className="doudizhu-entry-actions">
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

export default DouDiZhuEntry;
