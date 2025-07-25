// src/utils/store.js
import { create } from 'zustand';
import { produce } from 'immer';
import { createDeck, shuffleDeck, dealCards } from '../game-logic/deck';
import { SmartSplit, isFoulForAI } from '../game-logic/ai-logic';
import { calcSSSAllScores } from '../game-logic/thirteen-water-rules'; // 假设你的计分逻辑在这个文件

export const STAGES = {
  LOBBY: 'lobby',
  DEALING: 'dealing',
  PLAYING: 'playing',
  SUBMITTING: 'submitting',
  FINISHED: 'finished',
};

// --- 辅助函数 ---
const toCardString = (card) => {
  if (!card || !card.rank || !card.suit) return '';
  const rankMap = { 'A': 'ace', 'K': 'king', 'Q': 'queen', 'J': 'jack', 'T': '10' };
  const rankStr = rankMap[card.rank] || card.rank.toLowerCase();
  return `${rankStr}_of_${card.suit}`;
};

const toCardObject = (str) => {
  if (!str) return null;
  const parts = str.split('_of_');
  if (parts.length < 2) return null;
  const rev = { ace: 'A', king: 'K', queen: 'Q', jack: 'J', '10': 'T' };
  const rank = rev[parts[0]] || parts[0].toUpperCase();
  return { rank, suit: parts[1] };
};

const toHandStrings = (hand) => ({
  head: (hand.head || []).map(toCardString),
  middle: (hand.middle || []).map(toCardString),
  tail: (hand.tail || []).map(toCardString)
});

const useGameStore = create((set, get) => ({
  stage: STAGES.LOBBY,
  players: [
    { id: 'player1', name: '你', submitted: false, isReady: false, points: 100, isFoul: false },
    { id: 'player2', name: '小明', submitted: false, isReady: true, points: 100, isAI: true },
    { id: 'player3', name: '小红', submitted: false, isReady: true, points: 100, isAI: true },
    { id: 'player4', name: '小刚', submitted: false, isReady: true, points: 100, isAI: true },
  ],

  resetRound: () => set(produce(state => {
    state.stage = STAGES.LOBBY;
    state.players.forEach(p => {
      p.submitted = false;
      p.isReady = !!p.isAI;
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
      const hands = dealCards(shuffled, 13, 4);

      set(produce(state => {
        state.players.forEach((player, index) => {
          const playerHandObjects = hands[index];
          const playerHandStrings = playerHandObjects.map(toCardString);
          
          // AI 和玩家都使用智能理牌作为初始牌型
          const splitResult = SmartSplit(playerHandStrings)[0];

          if (splitResult) {
            player.head = splitResult.head.map(toCardObject);
            player.middle = splitResult.middle.map(toCardObject);
            player.tail = splitResult.tail.map(toCardObject);
            player.isFoul = isFoulForAI(splitResult.head, splitResult.middle, splitResult.tail);
          }
        });
        state.stage = STAGES.PLAYING;
      }));
    }, 500);
  },
  
  setPlayerReady: (playerId) => set(produce(state => {
    const player = state.players.find(p => p.id === playerId);
    if (player) {
      player.isReady = !player.isReady; // 允许取消准备
    }
    
    // 只有在Lobby阶段，所有人都准备好才开始游戏
    if (state.stage === STAGES.LOBBY) {
      const allReady = state.players.every(p => p.isReady);
      if (allReady) {
        get().startGame();
      }
    }
  })),

  updatePlayerHands: (playerId, newHands) => set(produce(state => {
    const player = state.players.find(p => p.id === playerId);
    if (player) {
      player.head = newHands.head;
      player.middle = newHands.middle;
      player.tail = newHands.tail;
      const handStrings = toHandStrings(newHands);
      player.isFoul = isFoulForAI(handStrings.head, handStrings.middle, handStrings.tail);
    }
  })),
  
  autoSplitForPlayer: (playerId) => set(produce(state => {
      const player = state.players.find(p => p.id === playerId);
      if (player && (player.head || player.middle || player.tail)) {
        const allCards = [
          ...player.head.map(toCardString),
          ...player.middle.map(toCardString),
          ...player.tail.map(toCardString),
        ];
        const splitResult = SmartSplit(allCards)[0];
        if (splitResult) {
          player.head = splitResult.head.map(toCardObject);
          player.middle = splitResult.middle.map(toCardObject);
          player.tail = splitResult.tail.map(toCardObject);
          player.isFoul = isFoulForAI(splitResult.head, splitResult.middle, splitResult.tail);
        }
      }
  })),

  submitHands: () => {
    const { players } = get();
    const me = players.find(p => p.id === 'player1');
    if (me && me.isFoul) {
      if (!window.confirm("当前牌型为倒水，确定要提交吗？")) {
        return;
      }
    }
    set({ stage: STAGES.SUBMITTING });
    
    set(produce(state => {
      state.players.forEach(p => p.submitted = true);
    }));

    setTimeout(() => {
      const handsForScoring = players.map(p => ({
        ...toHandStrings(p),
        isFoul: p.isFoul // 将倒水状态传递给计分函数
      }));
      // 这里假设计分函数能处理isFoul属性
      const scoresArray = calcSSSAllScores(handsForScoring);

      set(produce(state => {
        state.players.forEach((p, index) => {
          const resultData = scoresArray[index];
          p.score = resultData.totalScore;
          p.points += resultData.totalScore;
          p.handDetails = resultData.details;
        });
        state.stage = STAGES.FINISHED;
      }));
    }, 1500);
  },
}));

export { useGameStore };
