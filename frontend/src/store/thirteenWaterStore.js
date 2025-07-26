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

// 工具函数，确保 rank 映射包含 'T'
const toCardString = (card) => {
  if (!card || !card.rank || !card.suit) return '';
  const rankMap = { 'A': 'ace', 'K': 'king', 'Q': 'queen', 'J': 'jack', 'T': '10' };
  const rankStr = rankMap[card.rank] || String(card.rank).toLowerCase();
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
  head: (hand.head || []).map(toCardString).filter(Boolean),
  middle: (hand.middle || []).map(toCardString).filter(Boolean),
  tail: (hand.tail || []).map(toCardString).filter(Boolean)
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
      p.score = 0;
      p.handDetails = null;
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
              player.head = []; player.middle = []; player.tail = [];
              player.isFoul = true;
              player.submitted = !!player.isAI;
              return;
            }
            
            //无论是AI还是玩家，发牌时都先用AI理一次牌
            // 1. 转换成字符串数组给AI
            const handOfStrings = handOfObjects.map(toCardString);
            
            // 2. AI返回字符串格式的牌墩
            const splitResultStrings = SmartSplit(handOfStrings)[0];

            if (splitResultStrings && splitResultStrings.head && splitResultStrings.middle && splitResultStrings.tail) {
                // 3. 用字符串牌墩判断是否倒水
                player.isFoul = isFoul(splitResultStrings.head, splitResultStrings.middle, splitResultStrings.tail);
                
                // 4. 将字符串牌墩转回对象，存入state
                player.head = splitResultStrings.head.map(toCardObject).filter(Boolean);
                player.middle = splitResultStrings.middle.map(toCardObject).filter(Boolean);
                player.tail = splitResultStrings.tail.map(toCardObject).filter(Boolean);
            } else { 
                // AI分牌失败的容错处理
                player.head = [];
                player.middle = [];
                player.tail = handOfObjects; // 将所有牌放入尾道
                player.isFoul = true;
            }
            
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
    const allReady = state.players.every(p => p.isReady);
    if (allReady && state.stage === STAGES.LOBBY) {
      get().startGame();
    }
  })),

  updatePlayerHands: (playerId, newHands) => set(produce(state => {
    const player = state.players.find(p => p.id === playerId);
    if (player) {
      // newHands 是从UI传来的对象数组，直接赋值
      player.head = newHands.head || [];
      player.middle = newHands.middle || [];
      player.tail = newHands.tail || [];
      
      // 【关键修复】调用 isFoul 前，必须将对象数组转为字符串数组
      const handStrings = toHandStrings(newHands);
      player.isFoul = isFoul(handStrings.head, handStrings.middle, handStrings.tail);
    }
  })),
  
  autoSplitForPlayer: (playerId) => set(produce(state => {
      const player = state.players.find(p => p.id === playerId);
      if (player) {
        const allCardsObjects = [...(player.head || []), ...(player.middle || []), ...(player.tail || [])];
        
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

  submitHands: () => {
    const { players, stage } = get();
    if (stage !== STAGES.PLAYING) return;
    
    const me = players.find(p => p.id === 'player1');
    if (me.isFoul && !window.confirm("当前牌型为倒水，确定要提交吗？")) {
      return;
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
            ...toHandStrings(p), // 确保传给计分函数的是字符串牌墩
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