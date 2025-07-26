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
        get().resetRound();
        return;
      }

      set(produce(state => {
        state.players.forEach((player, index) => {
            const handOfObjects = playerHands[index];
            if (!Array.isArray(handOfObjects) || handOfObjects.length !== 13) {
              player.head = []; player.middle = []; player.tail = [];
              player.isFoul = true;
              player.submitted = !!player.isAI;
              return;
            }
            
            const handOfStrings = handOfObjects.map(toCardString);
            const splitResultStrings = SmartSplit(handOfStrings)[0];

            if (splitResultStrings && splitResultStrings.head && splitResultStrings.middle && splitResultStrings.tail) {
                player.isFoul = isFoul(splitResultStrings.head, splitResultStrings.middle, splitResultStrings.tail);
                player.head = splitResultStrings.head.map(toCardObject).filter(Boolean);
                player.middle = splitResultStrings.middle.map(toCardObject).filter(Boolean);
                player.tail = splitResultStrings.tail.map(toCardObject).filter(Boolean);
            } else { 
                player.head = [];
                player.middle = [];
                player.tail = handOfObjects;
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
      player.head = newHands.head || [];
      player.middle = newHands.middle || [];
      player.tail = newHands.tail || [];
      
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