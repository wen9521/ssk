// frontend/src/utils/eight-cards.store.js
import { create } from 'zustand';
import { produce } from 'immer';
import { createDeck, shuffleDeck, dealCards } from '@/game-logic/deck';

// 复用十三水的阶段定义
export const STAGES = {
  LOBBY: 'lobby',
  DEALING: 'dealing',
  PLAYING: 'playing',
  SUBMITTING: 'submitting',
  FINISHED: 'finished',
};

// 简单的卡牌对象转换，因为我们还没有八张的AI和规则
const toCardObject = (card) => ({ rank: card.rank, suit: card.suit });

export const useEightCardsStore = create((set, get) => ({
  stage: STAGES.LOBBY,
  players: [
    { id: 'player1', name: '你', isReady: false, points: 100, isAI: false },
    { id: 'player2', name: 'AI  Alpha', isReady: true, points: 100, isAI: true },
    { id: 'player3', name: 'AI Beta', isReady: true, points: 100, isAI: true },
    { id: 'player4', name: 'AI Gamma', isReady: true, points: 100, isAI: true },
    { id: 'player5', name: 'AI Delta', isReady: true, points: 100, isAI: true },
    { id: 'player6', name: 'AI Epsilon', isReady: true, points: 100, isAI: true },
  ],

  resetRound: () => set(produce(state => {
    state.stage = STAGES.LOBBY;
    state.players.forEach(p => {
      p.isReady = !!p.isAI;
      p.submitted = false;
      p.isFoul = false;
      delete p.head;
      delete p.middle;
      delete p.tail;
      delete p.score;
      delete p.handDetails;
    });
  })),

  startGame: () => {
    set({ stage: STAGES.DEALING });
    setTimeout(() => {
      const deck = createDeck();
      const shuffled = shuffleDeck(deck);
      // 6个玩家，每人8张牌
      const hands = dealCards(shuffled, 8, 6);
      
      set(produce(state => {
        state.players.forEach((player, index) => {
          const playerHand = hands[index]; // 8张牌
          
          // 自动将牌随机分配到三道中
          const randomHand = shuffleDeck(playerHand);
          
          player.head = randomHand.slice(0, 2).map(toCardObject);   // 头道: 2张
          player.middle = randomHand.slice(2, 5).map(toCardObject); // 中道: 3张
          player.tail = randomHand.slice(5, 8).map(toCardObject);   // 尾道: 3张

          player.isFoul = false; // 暂时不计算倒水
        });
        state.stage = STAGES.PLAYING;
      }));
    }, 500);
  },
  
  setPlayerReady: (playerId) => set(produce(state => {
    const player = state.players.find(p => p.id === playerId);
    if (player && state.stage === STAGES.LOBBY) {
      player.isReady = !player.isReady;
    }
    // 检查所有玩家是否都准备好了
    const allReady = state.players.every(p => p.isReady);
    if (allReady && state.stage === STAGES.LOBBY) {
      get().startGame();
    }
  })),

  // 以下功能为占位，未来实现完整游戏逻辑时需要
  updatePlayerHands: (playerId, newHands) => {},
  submitHands: () => {
      alert("比牌逻辑尚未实现！");
  },
}));