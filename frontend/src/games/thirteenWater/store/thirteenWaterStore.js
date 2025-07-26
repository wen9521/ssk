// frontend/src/games/thirteenWater/store/thirteenWaterStore.js
import create from 'zustand';
// ... (imports)

const useThirteenWaterStore = create((set, get) => ({
  // ... (state) ...

  // --- 操作 (Actions) ---
  dealCards: () => { /* ... */ },

  moveCard: (cardToMove, toZone) => {
    set((state) => {
      // --- THIS IS THE FIX ---
      // 1. Remove the card from ALL possible previous locations to prevent duplication.
      const newPlayerHand = state.playerHand.filter(c => !(c.rank === cardToMove.rank && c.suit === cardToMove.suit));
      const newFront = state.playerArrangement.front.filter(c => !(c.rank === cardToMove.rank && c.suit === cardToMove.suit));
      const newMiddle = state.playerArrangement.middle.filter(c => !(c.rank === cardToMove.rank && c.suit === cardToMove.suit));
      const newBack = state.playerArrangement.back.filter(c => !(c.rank === cardToMove.rank && c.suit === cardToMove.suit));

      // 2. Add the card to its new zone.
      const newArrangement = {
        front: newFront,
        middle: newMiddle,
        back: newBack,
      };
      newArrangement[toZone] = [...newArrangement[toZone], cardToMove];
      
      return {
        playerHand: newPlayerHand,
        playerArrangement: newArrangement,
      };
    });
  },

  setPlayerArrangement: (arrangement) => { /* ... */ },
  compareResults: () => { /* ... */ },
  resetGame: () => { /* ... */ }
}));

export default useThirteenWaterStore;
