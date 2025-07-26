// src/game-logic/index.js

// Thirteen-Water（十三水）相关
export {
  createDeck,
  shuffleDeck,
  dealCards,
  SmartSplit,
  isFoul,
  calcSSSAllScores
} from './deck.js';

// Dou-Dizhu（斗地主）相关
export {
  DoudizhuGame,
  parseHand,
  canPlay,
  valueMap,
  JokerRanks,
  HandType,
  DoudizhuStage       // ← 添加这一行
} from './doudizhu.rules.js';