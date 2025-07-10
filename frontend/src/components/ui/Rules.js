// src/components/ui/Rules.js

import React from 'react';
import '../../styles/Rules.css';

const Rules = ({ onClose }) => {
  return (
    <div className="rules-overlay">
      <div className="rules-modal">
        <h2>十三水游戏规则</h2>
        <div className="rules-content">
          <h3>基本目标</h3>
          <p>每个玩家拿到 13 张牌, 并将牌分成三墩：头墩(3张)、中墩(5张)和尾墩(5张)。理好后, 所有玩家进行比牌。</p>
          
          <h3>牌型大小</h3>
          <p><strong>尾墩</strong> 必须大于等于 <strong>中墩</strong>, <strong>中墩</strong> 必须大于等于 <strong>头墩</strong>。如果不符合, 则称为“倒水”。倒水的玩家通赔。</p>
          <p>牌型从大到小：同花顺 > 铁支 > 葫芦 > 同花 > 顺子 > 三条 > 两对 > 对子 > 散牌。</p>

          <h3>比牌与计分</h3>
          <p>普通牌型比牌时, 每一墩单独进行比较。与另外三家一一对比, 每赢一墩得 1 分。</p>
          
          <h3>特殊牌型加分</h3>
          <p>特殊牌型不需要比牌, 直接获得大量分数。如果多个玩家都有特殊牌型, 则按大小比较。</p>
          <ul>
            <li><strong>至尊清龙 (一条龙)</strong>: +108 分。13张牌为 A-K 的顺子。</li>
            <li><strong>十二皇族</strong>: +24 分。13张牌都是 J, Q, K, A。</li>
            <li><strong>三同花顺</strong>: +20 分。三墩都是同花顺。</li>
            <li><strong>三分天下 (三铁支)</strong>: +16 分。有三个铁支。</li>
            <li><strong>全大/全小</strong>: +10 分。所有牌都是 A-8 或 8-2。</li>
            <li><strong>凑一色</strong>: +10 分。所有牌都是红桃/方块或黑桃/梅花。</li>
            <li><strong>四套三条</strong>: +8 分。有四个三条。</li>
            <li><strong>五对三条</strong>: +6 分。有五个对子和一个三条。</li>
            <li><strong>六对半</strong>: +5 分。有六个对子。</li>
            <li><strong>三顺子/三同花</strong>: +4 分。三墩分别为顺子或同花。</li>
          </ul>

          <h3>打枪</h3>
          <p>当你三墩牌都大于某个玩家时, 称为“打枪”, 分数翻倍。如果你的三墩都大于其他所有三家, 称为“全垒打”, 分数会变得非常高。</p>
          
        </div>
        <button onClick={onClose}>关闭</button>
      </div>
    </div>
  );
};

export default Rules;
