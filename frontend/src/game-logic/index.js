// src/game-logic/index.js

/**
 * Game Logic 入口
 * 将十三水与斗地主两套逻辑统一出口
 */

/*
 * 十三水（Thirteen-Water）牌相关工具
 */
export { createDeck, shuffleDeck, dealCards, SmartSplit } from './deck.js';

/*
 * 斗地主（Dou-Dizhu）相关工具与主类
 */
export {
  DoudizhuGame,
  parseHand,
  canPlay,
  valueMap,
  JokerRanks,
  HandType
} from './doudizhu.rules.js';