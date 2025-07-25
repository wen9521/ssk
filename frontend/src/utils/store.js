// frontend/src/utils/store.js (支持手牌区域)
import { create } from 'zustand';
import { produce } from 'immer';
import { createDeck, shuffleDeck, dealCards } from '../game-logic/deck';
import { SmartSplit } from '../game-logic/ai-logic'; // AI仍然需要智能理牌
import { isFoul } from '../game-logic/thirteen-water-rules'; // 注意路径

export const STAGES = {
  LOBBY: 'lobby',
  DEALING: 'dealing',
  PLAYING: 'playing',
  SUBMITTING: 'submitting',
  FINISHED: 'finished',
};

// --- 辅助函数 (保持不变) ---
const toCardString = (card) => {
    const rankMap = { 'A': 'ace', 'K': 'king', 'Q': 'queen', 'J': 'jack', 'T': '10'};
    const rankStr = rankMap[card.rank] || card.rank.toLowerCase();
    return `${rankStr}_of_${card.suit}`;
};
const toCardObject = (str) => {
    const parts = str.split('_of_');
    const rev = { ace:'A', king:'K', queen:'Q', jack:'J', '10':'T' };
    const rank = rev[parts[0]] || parts[0].toUpperCase();
    return { rank, suit: parts[1] };
};
const toHandStrings = (hand) => ({
  head: (hand.head || []).map(toCardString),
  middle: (hand.middle || []).map(toCardString),
  tail: (hand.tail || []).map(toCardString)
});

// 排序函数，用于整理手牌
const sortHandForDisplay = (hand) => {
    const ranksOrder = ['2','3','4','5','6','7','8','9','T','J','Q','K','A'];
    const suitsOrder = ['diamonds','clubs','hearts','spades'];
    if (!Array.isArray(hand)) return [];
    return [...hand].sort((a, b) => {
        const rA = ranksOrder.indexOf(a.rank);
        const rB = ranksOrder.indexOf(b.rank);
        if (rA !== rB) return rA - rB;
        return suitsOrder.indexOf(a.suit) - suitsOrder.indexOf(b.suit);
    });
};

const useGameStore = create((set, get) => ({
  // --- 状态 (State) ---
  stage: STAGES.LOBBY,
  players: [
    { id: 'player1', name: '总指挥官', submitted: false, isReady: false, points: 0, isFoul: false, hand: [], head: [], middle: [], tail: [] },
    { id: 'player2', name: '震荡波', submitted: false, isReady: true, points: 0, isAI: true },
    { id: 'player3', name: '红蜘蛛', submitted: false, isReady: true, points: 0, isAI: true },
    { id: 'player4', name: '声波', submitted: false, isReady: true, points: 0, isAI: true },
  ],
  // ... (其他状态不变)

  // --- 操作 (Actions) ---

  resetRound: () => set(
    produce((state) => {
      state.stage = STAGES.LOBBY;
      state.players.forEach((player) => {
        player.submitted = false;
        player.isReady = !!player.isAI;
        player.isFoul = false;
        player.hand = [];
        player.head = [];
        player.middle = [];
        player.tail = [];
        delete player.score;
        delete player.handDetails;
      });
    })
  ),
  
  startGame: () => {
    set({ stage: STAGES.DEALING });

    setTimeout(() => {
      const deck = createDeck();
      const shuffled = shuffleDeck(deck);
      const hands = dealCards(shuffled, 13, 4);

      set(produce(state => {
        state.players.forEach((player, index) => {
          const playerHandObjects = hands[index];

          if (player.isAI) {
            // AI直接理好牌
            const playerHandStrings = playerHandObjects.map(toCardString);
            const sortedHand = SmartSplit(playerHandStrings)[0];
            player.head = sortedHand.head.map(toCardObject);
            player.middle = sortedHand.middle.map(toCardObject);
            player.tail = sortedHand.tail.map(toCardObject);
            player.hand = []; // AI没有手牌区
            player.isFoul = isFoul(sortedHand.head, sortedHand.middle, sortedHand.tail);
          } else {
            // 玩家获得13张手牌
            player.hand = sortHandForDisplay(playerHandObjects);
            player.head = [];
            player.middle = [];
            player.tail = [];
            player.isFoul = false; // 初始不是倒水
          }
        });
        state.stage = STAGES.PLAYING;
      }));
    }, 500);
  },
  
  // setPlayerReady 不变

  updatePlayerHands: (playerId, newHands) => set(produce(state => {
    const player = state.players.find(p => p.id === playerId);
    if(player) {
      player.head = newHands.head;
      player.middle = newHands.middle;
      player.tail = newHands.tail;
      player.hand = sortHandForDisplay(newHands.hand); // 保持手牌有序
      
      const handStrings = toHandStrings(newHands);
      player.isFoul = isFoul(handStrings.head, handStrings.middle, handStrings.tail);
    }
  })),

  // submitHands 和其他action保持不变
  
  setPlayerReady: (playerId) => set(produce(state => {
    const player = state.players.find(p => p.id === playerId);
    if (player) {
      player.isReady = true;
    }
    const allReady = state.players.every(p => p.isReady);
    if (allReady) {
      get().startGame();
    }
  })),

  submitHands: () => {
    const { players } = get();
    const me = players.find(p => p.id === 'player1');
    if (me.isFoul) {
        if (!window.confirm("警告：阵型存在严重逻辑错误(倒水)，确认强行部署？")) {
            return;
        }
    }

    set({ stage: STAGES.SUBMITTING });
    
    set(produce(state => {
      state.players.forEach(p => p.submitted = true);
    }));

    setTimeout(() => {
      const handsForScoring = players.map(p => toHandStrings(p));
      const scoresArray = calcSSSAllScores(handsForScoring);

      set(produce(state => {
        state.players.forEach((p, index) => {
            const resultData = scoresArray[index];
            p.score = resultData.totalScore;
            p.isFoul = resultData.isFoul;
            p.points = (p.points || 0) + resultData.totalScore;
            p.handDetails = resultData.details;
        });
        state.stage = STAGES.FINISHED;
      }));
    }, 1500);
  },
}));

export { useGameStore };
