// src/utils/doudizhu-store.js
import { create } from 'zustand';
import { createDeck, shuffleDeck } from '@/game-logic/deck';
import { JokerRanks } from '@/game-logic/doudizhu-rules';

export const DoudizhuStage = {
  BIDDING: 'BIDDING',
  PLAYING: 'PLAYING',
  FINISHED: 'FINISHED',
};

// 完整的牌组，包含大小王
const createDoudizhuDeck = () => {
    const standardDeck = createDeck();
    // 确保 Joker 的 rank 和 suit 格式与其他卡牌一致
    standardDeck.push({ rank: JokerRanks.BLACK_JOKER, suit: 'joker' });
    standardDeck.push({ rank: JokerRanks.RED_JOKER, suit: 'joker' });
    return standardDeck;
};

export const useDoudizhuStore = create((set, get) => ({
  stage: DoudizhuStage.BIDDING,
  players: [
    { id: 'player1', name: '你', isAI: false, hand: [] },
    { id: 'player2', name: '电脑A', isAI: true, hand: [] },
    { id: 'player3', name: '电脑B', isAI: true, hand: [] },
  ],
  landlordId: null,
  landlordCards: [],
  currentPlayerId: null,
  currentHand: null,
  lastPlayerId: null,

  startGame: () => {
    const fullDeck = createDoudizhuDeck();
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
      currentPlayerId: 'player1', // 假设总是玩家1先开始叫地主
      currentHand: null,
      lastPlayerId: null,
    });
  },
}));