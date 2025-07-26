// frontend/src/games/thirteenWater/store/thirteenWaterStore.js
import create from 'zustand';
// ... (imports)

const useThirteenWaterStore = create((set, get) => ({
  // ... (state) ...

  // --- 操作 (Actions) ---
  dealCards: () => { /* ... */ },

  moveCard: (cardToMove, toZone) => {
    set((state) => {
      // 1. 从所有可能的位置移除这张牌
      const newPlayerHand = state.playerHand.filter(c => c.rank !== cardToMove.rank || c.suit !== cardToMove.suit);
      const newFront = state.playerArrangement.front.filter(c => c.rank !== cardToMove.rank || c.suit !== cardToMove.suit);
      // ... (remove from middle and back as well)

      // 2. 将牌添加到新的区域
      const arrangement = { ...state.playerArrangement };
      arrangement[toZone] = [...arrangement[toZone], cardToMove];
      
      return {
        playerHand: newPlayerHand,
        playerArrangement: arrangement
      };
    });
  },

  setPlayerArrangement: (arrangement) => { /* ... */ },
  compareResults: () => { /* ... */ },
  resetGame: () => { /* ... */ }
}));

export default useThirteenWaterStore;
