// frontend/src/games/bigTwo/store/bigTwoStore.js
import create from 'zustand';
import { deal as dealCardsUtil } from '../../../utils/card-utils';
import { canPlay, getHandType, compareHands } from '../logic/big-two-rules';
import { getAIPlay } from '../logic/big-two-ai'; // Assuming AI logic exists

const useBigTwoStore = create((set, get) => ({
  gameState: 'waiting', // waiting, playing, finished
  players: {
    player: { hand: [] },
    opponent1: { hand: [] },
    opponent2: { hand: [] },
    opponent3: { hand: [] },
  },
  currentPlayer: null,
  lastPlay: null,
  turnWinner: null,
  winner: null,

  deal: () => {
    const { hands } = dealCardsUtil(4, 13);
    let firstPlayer = 'player'; // Default, will be updated
    
    const players = {
        player: { hand: hands[0] },
        opponent1: { hand: hands[1] },
        opponent2: { hand: hands[2] },
        opponent3: { hand: hands[3] },
    };

    // Find who has the Diamond 3 to start the game
    for (const playerName in players) {
        if (players[playerName].hand.some(c => c.suit === 'diamonds' && c.rank === '3')) {
            firstPlayer = playerName;
            break;
        }
    }
    
    set({
      gameState: 'playing',
      players,
      currentPlayer: firstPlayer,
      lastPlay: null,
      turnWinner: firstPlayer,
      winner: null,
    });

    if (firstPlayer !== 'player') {
        setTimeout(() => get().aiTurn(), 1000);
    }
  },

  playCards: (cards) => {
    const { players, currentPlayer, lastPlay, turnWinner } = get();
    if (currentPlayer !== 'player') return;

    // It must be a valid hand and be better than the last play (if any)
    const handType = getHandType(cards);
    const isNewTurn = turnWinner === 'player';
    if (!handType || (!isNewTurn && !canPlay(cards, lastPlay))) {
      console.error("Invalid play");
      return;
    }

    const newHand = players.player.hand.filter(card => !cards.find(c => c.rank === card.rank && c.suit === card.suit));
    
    set(state => ({
      players: { ...state.players, player: { hand: newHand } },
      lastPlay: { player: 'player', cards, type: handType },
      turnWinner: 'player', // The current player is now the turn winner
    }));

    if (newHand.length === 0) {
      set({ gameState: 'finished', winner: 'player' });
      return;
    }
    
    const nextPlayer = getNextPlayer(currentPlayer);
    set({ currentPlayer: nextPlayer });
    setTimeout(() => get().aiTurn(), 1000);
  },
  
  pass: () => {
    const { currentPlayer, turnWinner } = get();
    if (currentPlayer === turnWinner) {
        console.error("The turn winner cannot pass.");
        return;
    }
    const nextPlayer = getNextPlayer(currentPlayer);
    set({ currentPlayer: nextPlayer });
    setTimeout(() => get().aiTurn(), 1000);
  },

  aiTurn: () => {
    const { players, currentPlayer, lastPlay, turnWinner } = get();
    const aiHand = players[currentPlayer].hand;
    
    const play = getAIPlay(aiHand, turnWinner === currentPlayer ? null : lastPlay);

    if (play) {
      const newHand = aiHand.filter(card => !play.find(c => c.rank === card.rank && c.suit === card.suit));
      const handType = getHandType(play);

      set(state => ({
        players: { ...state.players, [currentPlayer]: { hand: newHand } },
        lastPlay: { player: currentPlayer, cards: play, type: handType },
        turnWinner: currentPlayer,
      }));

      if (newHand.length === 0) {
        set({ gameState: 'finished', winner: currentPlayer });
        return;
      }
    } else {
        // AI Passes
    }

    const nextPlayer = getNextPlayer(currentPlayer);
    set({ currentPlayer: nextPlayer });
    if(nextPlayer !== 'player') {
        setTimeout(() => get().aiTurn(), 1000);
    }
  },
}));

const playerOrder = ['player', 'opponent1', 'opponent2', 'opponent3'];
const getNextPlayer = (current) => {
  const currentIndex = playerOrder.indexOf(current);
  return playerOrder[(currentIndex + 1) % 4];
};

export default useBigTwoStore;
