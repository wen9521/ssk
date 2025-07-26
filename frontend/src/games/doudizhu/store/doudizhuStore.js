// frontend/src/games/doudizhu/store/doudizhuStore.js
import create from 'zustand';
import { parseHand, canPlay } from '../logic/doudizhu.rules';
import { getAIBid, getAIPlay } from '../logic/doudizhu.ai.js';
import { deal as dealCardsUtil } from '../../../utils/card-utils';

const useDoudizhuStore = create((set, get) => ({
  // ... (状态保持不变) ...

  // --- 操作 (Actions) ---
  deal: () => { /* ... */ },

  // AI 叫分
  aiBid: () => {
    const { players, currentPlayer } = get();
    const bid = getAIBid(players[currentPlayer].hand);
    // ... 在此实现叫分和轮转 ...
  },
  
  // 玩家出牌
  playCards: (cards) => { /* ... */ },

  // AI 出牌
  aiTurn: () => {
    const { currentPlayer, players, lastPlay, turnWinner } = get();
    const isLandlord = players[currentPlayer].isLandlord;
    const nextPlayer = getNextPlayer(currentPlayer);
    const nextPlayerRole = players[nextPlayer].isLandlord ? 'landlord' : 'farmer';

    if (players[currentPlayer].isLandlord !== undefined) { 
      setTimeout(() => {
        const aiHand = players[currentPlayer].hand;
        const currentLastPlay = (turnWinner === currentPlayer) ? null : lastPlay;
        const play = getAIPlay(aiHand, currentLastPlay, isLandlord, nextPlayerRole);

        if (play) {
          get().playCards(play);
        } else {
          get().pass();
        }
      }, 1000);
    }
  },

  pass: () => { /* ... */ }
}));

function getNextPlayer(currentPlayer) {
  // ...
}

export default useDoudizhuStore;
