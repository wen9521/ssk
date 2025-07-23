import { create } from 'zustand';
import { produce } from 'immer';
import { autoArrangeCards } from '../game-logic/thirteen-water-rules.js'; // 导入规则以获取电脑决策

// 游戏的不同阶段
const STAGES = {
  LOBBY: 'lobby',          // 游戏大厅
  PLAYING: 'playing',      // 游戏中，理牌
  SUBMITTING: 'submitting', // 提交中，等待后端响应
  SUBMITTED: 'submitted',  // 本地玩家已提交牌，等待其他玩家
  FINISHED: 'finished',    // 所有玩家出牌，结算完成
};

// 后端 API 地址
const API_URL = 'https://9525.ip-ddns.com/api/v1/thirteen-water/calculate';

const useGameStore = create((set, get) => ({
  // --- 状态 (State) ---
  stage: STAGES.PLAYING,
  players: [
    { id: 'player1', name: '我', cards: [], isReady: false },
    { id: 'player2', name: '电脑 A', cards: [], isReady: true },
    { id: 'player3', name: '电脑 B', cards: [], isReady: true },
    { id: 'player4', name: '电脑 C', cards: [], isReady: true },
  ],
  myCards: [],
  finalResults: null,
  error: null, // 用于存储错误信息

  // --- 操作 (Actions) ---

  setStage: (newStage) => set({ stage: newStage }),

  dealNewRound: (shuffledDecks) => set(
    produce((state) => {
      state.stage = STAGES.PLAYING;
      state.finalResults = null;
      state.error = null;
      state.players.forEach((player, index) => {
        player.cards = shuffledDecks[index];
        player.isReady = player.id.startsWith('computer');
      });
      state.myCards = shuffledDecks[0];
    })
  ),

  // 玩家提交牌组（现在是异步的）
  submitMyHand: async (mySortedHand) => {
    set({ stage: STAGES.SUBMITTING, error: null }); // 进入“提交中”状态

    try {
      // 1. 准备所有玩家的数据
      const players = get().players;
      const payload = players.map(player => {
        if (player.id === 'player1') {
          return { id: player.id, hands: mySortedHand };
        }
        // 对于电脑，我们使用规则引擎为其生成最佳牌组
        const autoHand = autoArrangeCards(player.cards);
        return { id: player.id, hands: autoHand };
      });

      console.log('Sending to backend:', JSON.stringify(payload, null, 2));

      // 2. 调用后端 API
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Backend returned a non-JSON error response' }));
        throw new Error(errorData.error || `Backend responded with status ${response.status}`);
      }

      const results = await response.json();
      console.log('Received results from backend:', results);
      
      // 3. 使用后端返回的权威结果更新状态
      set(
        produce((state) => {
            state.finalResults = results;
            state.stage = STAGES.FINISHED;
            state.players.forEach(p => { p.isReady = true; }); // 所有人都准备好了
        })
      );

    } catch (error) {
      console.error('Failed to submit hand:', error);
      set({ 
        stage: STAGES.PLAYING, // 出错了，回到游戏阶段让用户可以重试
        error: `提交失败: ${error.message}` 
      });
    }
  },

  setFinalResults: (results) => set(
    produce((state) => {
      state.finalResults = results;
      state.stage = STAGES.FINISHED;
    })
  ),

}));

export { useGameStore, STAGES };
