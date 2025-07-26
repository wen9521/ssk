// src/store/thirteenWaterStore.js
import { create } from 'zustand';
import { produce } from 'immer';
import { 
  createDeck, 
  shuffleDeck, 
  dealCards,
  SmartSplit,
  calcSSSAllScores,
  isFoul 
} from '../game-logic';

export const STAGES = {
  LOBBY: 'lobby',
  DEALING: 'dealing',
  PLAYING: 'playing',
  SUBMITTING: 'submitting',
  FINISHED: 'finished',
};

// 工具函数 (保持不变)
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

// 重命名为 useThirteenWaterStore
export const useThirteenWaterStore = create((set, get) => ({
  stage: STAGES.LOBBY,
  players: [
    { id: 'player1', name: '你', submitted: false, isReady: false, points: 100, isFoul: false, head: [], middle: [], tail: [] },
    { id: 'player2', name: 'AI·擎天柱', submitted: false, isReady: true, points: 100, isAI: true, head: [], middle: [], tail: [] },
    { id: 'player3', name: 'AI·大黄蜂', submitted: false, isReady: true, points: 100, isAI: true, head: [], middle: [], tail: [] },
    { id: 'player4', name: 'AI·威震天', submitted: false, isReady: true, points: 100, isAI: true, head: [], middle: [], tail: [] },
  ],

  resetRound: () => set(produce(state => {
    state.stage = STAGES.LOBBY;
    state.players.forEach(p => {
      p.submitted = false;
      p.isReady = !!p.isAI;
      p.isFoul = false;
      p.head = [];
      p.middle = [];
      p.tail = [];
      delete p.score;
      delete p.handDetails;
    });
  })),
  
  startGame: () => {
    set({ stage: STAGES.DEALING });
    setTimeout(() => {
      const deck = createDeck();
      const shuffled = shuffleDeck(deck);
      
      const playerCount = get().players.length;
      const cardsPerPlayer = 13;
      
      const playerHands = dealCards(shuffled, cardsPerPlayer, playerCount);

      if (!Array.isArray(playerHands) || playerHands.length < playerCount) {
        console.error('严重错误：发牌结果格式不符或数量不足！', playerHands);
        get().resetRound();
        return;
      }

      set(produce(state => {
        state.players.forEach((player, index) => {
            const handOfObjects = playerHands[index];

            if (!Array.isArray(handOfObjects) || handOfObjects.length !== 13) {
              console.error(`发牌失败：玩家 ${player.name} 的手牌不是一个有效的13张牌数组!`, handOfObjects);
              player.tail = []; // 避免渲染错误
              player.isFoul = true;
              player.submitted = !!player.isAI; // 确保AI能继续流程
              return;
            }
            
            // 将对象手牌转换为AI需要的字符串数组
            const handOfStrings = handOfObjects.map(toCardString);
            
            // AI进行智能分牌，得到的是字符串格式的牌墩
            const splitResultStrings = SmartSplit(handOfStrings)[0];

            if (splitResultStrings) {
                // 【核心修复】: isFoul 函数需要字符串格式的牌墩
                player.isFoul = isFoul(splitResultStrings.head, splitResultStrings.middle, splitResultStrings.tail);
                
                // 将字符串牌墩转换回对象格式，用于UI渲染
                player.head = splitResultStrings.head.map(toCardObject).filter(Boolean);
                player.middle = splitResultStrings.middle.map(toCardObject).filter(Boolean);
                player.tail = splitResultStrings.tail.map(toCardObject).filter(Boolean);

            } else {
                // 如果AI分牌失败，进行容错处理
                player.head = [];
                player.middle = [];
                // 将所有牌放入尾道，并标记为倒水
                player.tail = handOfObjects;
                player.isFoul = true;
            }
            
            // 只有AI玩家在发牌后自动提交
            player.submitted = !!player.isAI;
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
    // 检查是否所有玩家都准备好了
    const allReady = state.players.every(p => p.isReady);
    if (allReady && state.stage === STAGES.LOBBY) {
      get().startGame();
    }
  })),

  // updatePlayerHands 保持不变
  updatePlayerHands: (playerId, newHands) => set(produce(state => {
    const player = state.players.find(p => p.id === playerId);
    if (player) {
      player.head = newHands.head;
      player.middle = newHands.middle;
      player.tail = newHands.tail;
      // 在这里手动理牌时，也需要传递字符串格式给 isFoul
      const handStrings = toHandStrings(newHands);
      player.isFoul = isFoul(handStrings.head, handStrings.middle, handStrings.tail);
    }
  })),
  
  // autoSplitForPlayer 保持不变，但我们确保其逻辑健壮
  autoSplitForPlayer: (playerId) => set(produce(state => {
      const player = state.players.find(p => p.id === playerId);
      if (player) {
        // 整合所有手牌
        const allCardsObjects = [
          ...(player.head || []),
          ...(player.middle || []),
          ...(player.tail || [])
        ];
        
        if (allCardsObjects.length === 13) {
            const allCardStrings = allCardsObjects.map(toCardString);
            const splitResultStrings = SmartSplit(allCardStrings)[0];
            
            if (splitResultStrings) {
              player.isFoul = isFoul(splitResultStrings.head, splitResultStrings.middle, splitResultStrings.tail);
              player.head = splitResultStrings.head.map(toCardObject).filter(Boolean);
              player.middle = splitResultStrings.middle.map(toCardObject).filter(Boolean);
              player.tail = splitResultStrings.tail.map(toCardObject).filter(Boolean);
            }
        }
      }
  })),

  // submitHands 保持不变
  submitHands: () => {
    const { players } = get();
    const me = players.find(p => p.id === 'player1');
    if (me.isFoul) {
      if (!window.confirm("当前牌型为倒水，确定要提交吗？")) return;
    }

    set(produce(state => {
        const player = state.players.find(p => p.id === 'player1');
        if (player) player.submitted = true;
    }));

    const allSubmitted = get().players.every(p => p.submitted);
    if (allSubmitted) {
        set({ stage: STAGES.SUBMITTING });
        setTimeout(() => {
          const handsForScoring = get().players.map(p => ({
            ...toHandStrings(p),
            isFoul: p.isFoul
          }));
          const scoresArray = calcSSSAllScores(handsForScoring);
          set(produce(state => {
            state.players.forEach((p, index) => {
              if (scoresArray[index]) {
                const resultData = scoresArray[index];
                p.score = resultData.totalScore;
                p.points += resultData.totalScore;
                p.handDetails = resultData.details;
              }
            });
            state.stage = STAGES.FINISHED;
          }));
        }, 1500);
    }
  },
}));