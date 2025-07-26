// frontend/src/games/eightCards/store/eightCardsStore.js
import create from 'zustand';
import { deal as dealCardsUtil } from '../../../utils/card-utils';
import { canPlay, getWinningPlayer } from '../logic/eight-cards-rules';
import { getAIPlay }s from '../logic/eight-cards-ai'; // Assuming you have an AI logic file

const useEightCardsStore = create((set, get) => ({
  gameState: 'waiting', // waiting, playing, finished
  players: {
    player: { hand: [] },
    opponent: { hand: [] },
  },
  currentPlayer: 'player',
  discardPile: [],
  winner: null,
  
  deal: () => {
    const { hands } = dealCardsUtil(2, 8);
    set({
      gameState: 'playing',
      players: {
        player: { hand: hands[0] },
        opponent: { hand: hands[1] },
      },
      currentPlayer: 'player',
      discardPile: [],
      winner: null,
    });
  },

  playCard: (card) => {
    const { players, currentPlayer, discardPile } = get();
    if (currentPlayer !== 'player' || !canPlay(card, discardPile)) return;

    const newHand = players.player.hand.filter(c => !(c.rank === card.rank && c.suit === card.suit));
    const newDiscardPile = [card, ...discardPile];
    
    set(state => ({
      players: { ...state.players, player: { hand: newHand } },
      discardPile: newDiscardPile,
    }));

    if (newHand.length === 0) {
      set({ gameState: 'finished', winner: 'player' });
    } else {
      set({ currentPlayer: 'opponent' });
      setTimeout(() => get().aiTurn(), 1000);
    }
  },

  aiTurn: () => {
    const { players, discardPile } = get();
    const aiHand = players.opponent.hand;
    const cardToPlay = getAIPlay(aiHand, discardPile);

    if (cardToPlay) {
      const newHand = aiHand.filter(c => !(c.rank === cardToPlay.rank && c.suit === cardToPlay.suit));
      const newDiscardPile = [cardToPlay, ...discardPile];
      
      set(state => ({
        players: { ...state.players, opponent: { hand: newHand } },
        discardPile: newDiscardPile,
      }));

      if (newHand.length === 0) {
        set({ gameState: 'finished', winner: 'opponent' });
      } else {
        set({ currentPlayer: 'player' });
      }
    } else {
      // AI has no card to play, so it passes.
      set({ currentPlayer: 'player' });
    }
  },
}));

export default useEightCardsStore;
