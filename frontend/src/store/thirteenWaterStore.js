import { create } from 'zustand';
import { produce } from 'immer';
import {
  createDeck,
  shuffleDeck,
  dealCards,
} from '../game-logic/deck'; // 导入十三水的发牌逻辑
import { SmartSplit } from '../game-logic/ai-logic'; // 导入十三水的AI逻辑
import {
    calcSSSAllScores,
    isFoul
} from '../game-logic/thirteen-water-rules'; // 导入十三水的规则

export const STAGES = {
  LOBBY: 'lobby',
  DEALING: 'dealing',
  PLAYING: 'playing',
  SUBMITTING: 'submitting',
  FINISHED: 'finished',
};

// 不再需要 toCardString 和 toCardObject

export const useThirteenWaterStore = create((set, get) => ({
  stage: STAGES.LOBBY,
  players: [
    { id: 'player1', name: '你', submitted: false, isReady: false, points: 100, isFoul: false, hand: [], head: [], middle: [], tail: [] },
    { id: 'player2', name: 'AI·擎天柱', submitted: false, isReady: true, points: 100, isAI: true, hand: [], head: [], middle: [], tail: [] },
    { id: 'player3', name: 'AI·大黄蜂', submitted: false, isReady: true, points: 100, isAI: true, hand: [], head: [], middle: [], tail: [] },
    { id: 'player4', name: 'AI·威震天', submitted: false, isReady: true, points: 100, isAI: true, hand: [], head: [], middle: [], tail: [] },
  ],

  resetRound: () => set(produce(state => {
    state.stage = STAGES.LOBBY;
    state.players.forEach(p => {
      p.submitted = false;
      p.isReady = !!p.isAI;
      p.isFoul = false;
      p.hand = [];
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
      const hands = dealCards(shuffled, playerCount);

      set(produce(state => {
        state.players.forEach((player, index) => {
            player.hand = hands[index] || [];
            
            // AI 玩家自动理牌
            if (player.isAI && player.hand.length === 13) {
                const splitResult = SmartSplit(player.hand)[0];
                if (splitResult) {
                    player.head = splitResult.head;
                    player.middle = splitResult.middle;
                    player.tail = splitResult.tail;
                    player.isFoul = isFoul(player.head, player.middle, player.tail);
                    player.submitted = true;
                }
            } else { // 玩家的手牌需要自己摆
                player.head = [];
                player.middle = [];
                player.tail = [...player.hand]; // 默认全放在尾道
            }
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
      player.isFoul = isFoul(player.head, player.middle, player.tail);
    }
  })),
  
  autoSplitForPlayer: (playerId) => set(produce(state => {
      const player = state.players.find(p => p.id === playerId);
      if (player) {
        const allCards = [...player.head, ...player.middle, ...player.tail];
        if (allCards.length === 13) {
            const splitResult = SmartSplit(allCards)[0];
            if (splitResult) {
              player.head = splitResult.head;
              player.middle = splitResult.middle;
              player.tail = splitResult.tail;
              player.isFoul = isFoul(player.head, player.middle, player.tail);
            }
        }
      }
  })),

  submitHands: () => {
    const { players, stage } = get();
    if (stage !== STAGES.PLAYING) return;
    
    const me = players.find(p => p.id === 'player1');
    if (me.isFoul && !window.confirm("当前牌型为倒水(相公)，确定要提交吗？")) {
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
            front: p.head,
            middle: p.middle,
            back: p.tail,
            isFoul: p.isFoul,
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