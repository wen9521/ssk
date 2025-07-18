import { createDeck, shuffle } from './deck.js';

export class DouDizhuGame {
    constructor(playerNames = ['Player 1', 'Player 2', 'Player 3']) {
        this.deck = [];
        this.players = playerNames.map((name, index) => ({
            id: `player-${index}`,
            name: name,
            hand: [],
            isLandlord: false,
        }));
        this.landlordCards = [];
        this.turn = 0; // index of the current player
        this.lastPlay = null; // { playerId: string, cards: Card[] }
    }

    startGame() {
        this.deck = shuffle(createDeck());
        
        // Deal 17 cards to each player
        for (let i = 0; i < 17; i++) {
            for (const player of this.players) {
                player.hand.push(this.deck.pop());
            }
        }
        
        // The remaining 3 cards are for the landlord
        this.landlordCards = this.deck;
        
        // Sort hands for better display
        this.players.forEach(player => this.sortHand(player.hand));
        
        // Simplified: First player becomes the landlord
        this.setLandlord(this.players[0]);
        
        console.log('Game started:', this);
    }

    setLandlord(player) {
        player.isLandlord = true;
        player.hand.push(...this.landlordCards);
        this.sortHand(player.hand);
        // The landlord plays first
        this.turn = this.players.findIndex(p => p.id === player.id);
    }
    
    sortHand(hand) {
        hand.sort((a, b) => b.rank - a.rank);
    }
    
    // Placeholder for play validation logic
    isValidPlay(cards) {
        // TODO: Implement the complex rules of DouDizhu
        if (cards.length === 0) return true; // Passing is always valid
        return true; // Simplified for now
    }
}
