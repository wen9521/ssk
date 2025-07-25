// src/utils/doudizhu-store.js
import { create } from 'zustand';
import { produce } from 'immer';
import { createDeck, shuffleDeck } from '../game-logic/deck'; // 复用发牌逻辑
import { parseHand, canPlay } from '../game-logic/doudizhu-rules';

export const DoudizhuStage = {
  BIDDING: 'BIDDING',
  PLAYING: 'PLAYING',
  FINISHED: 'FINISHED',
};

const useDoudizhuStore = create((set, get) => ({
  stage: DoudizhuStage.BIDDING,
  players: [
    { id: 'player1', name: '你', isAI: false, hand: [] },
    { id: 'player2', name: '电脑A', isAI: true, hand: [] },
    { id: 'player3', name: '电脑B', isAI: true, hand: [] },
  ],
  landlordId: null,
  landlordCards: [], // 3张底牌
  currentPlayerId: null, // 当前出牌玩家
  currentHand: null, // 当前桌上的牌
  lastPlayerId: null, // 上一个出牌的玩家

  // --- Actions ---

  startGame: () => {
    // 斗地主需要54张牌
    const fullDeck = [...createDeck(), { rank: 'Black Joker', suit: 'joker' }, { rank: 'Red Joker', suit: 'joker' }];
    const shuffled = shuffleDeck(fullDeck);

    set({
      stage: DoudizhuStage.BIDDING,
      players: [
        { id: 'player1', name: '你', isAI: false, hand: shuffled.slice(0, 17) },
        { id: 'player2', name: '电脑A', isAI: true, hand: shuffled.slice(17, 34) },
        { id: 'player3', name: '电脑B', isAI: true, hand: shuffled.slice(34, 51) },
      ],
      landlordId: null,
      landlordCards: shuffled.slice(51, 54),
      currentPlayerId: 'player1', // 随机一个玩家开始叫地主
      currentHand: null,
      lastPlayerId: null,
    });
  },

  // 叫地主/出牌/跳过等逻辑需要在这里实现
  // ...
}));

export { useDoudizhuStore };