import { createDeck, shuffle } from './deck.js';

class DouDizhuGame {
    constructor(playerIds) {
        this.players = playerIds.map((id, index) => ({
            id: `player-${index}`,
            name: id,
            hand: [],
            isLandlord: false,
            playsCount: 0,
        }));
        this.baseScore = 10;
        this.multiplier = 1;
        this.landlordCards = [];
        this.currentTurnIndex = 0;
        this.lastValidPlay = { playerId: null, cards: [] };
        this.passPlayCount = 0;
        this.gameState = 'bidding'; // bidding, playing, ended
        this.biddingCycle = {
            bids: {}, // playerId: bid (0 for pass, 1, 2, 3)
            currentPlayerIndex: 0,
            highestBid: 0,
            lastBidder: null,
        };
    }

    startGame() {
        let deck = createDeck();
        deck = shuffle(deck);

        // Deal cards
        const hands = this.deal(deck, this.players.length, 17);
        this.players.forEach((player, i) => {
            player.hand = this.sortHand(hands[i]);
        });
        this.landlordCards = deck.slice(this.players.length * 17);
        
        // Randomly decide who starts bidding
        this.biddingCycle.currentPlayerIndex = Math.floor(Math.random() * this.players.length);
    }

    deal(deck, numPlayers, numCards) {
        const hands = [];
        for (let i = 0; i < numPlayers; i++) {
            hands.push(deck.slice(i * numCards, (i + 1) * numCards));
        }
        return hands;
    }
    
    sortHand(hand) {
        return hand.sort((a, b) => {
            if (a.rank !== b.rank) {
                return b.rank - a.rank;
            }
            return SUITS.indexOf(b.suit) - SUITS.indexOf(a.suit);
        });
    }

    // Bidding logic
    getCurrentBiddingPlayer() {
        return this.players[this.biddingCycle.currentPlayerIndex];
    }

    playerBid(playerId, bid) {
        const playerIndex = this.players.findIndex(p => p.id === playerId);
        if (playerIndex !== this.biddingCycle.currentPlayerIndex) return false;

        if (bid > 0 && bid > this.biddingCycle.highestBid) {
            this.biddingCycle.bids[playerId] = bid;
            this.biddingCycle.highestBid = bid;
            this.biddingCycle.lastBidder = playerId;
        } else {
            this.biddingCycle.bids[playerId] = 0; // Pass
        }
        
        const totalBids = Object.keys(this.biddingCycle.bids).length;
        
        if (this.biddingCycle.highestBid === 3 || totalBids === this.players.length) {
            this.finalizeBidding();
        } else {
             // Move to next player
            this.biddingCycle.currentPlayerIndex = (this.biddingCycle.currentPlayerIndex + 1) % this.players.length;
        }
        return true;
    }

    finalizeBidding() {
        const landlordId = this.biddingCycle.lastBidder;
        if (landlordId) {
            const landlord = this.getPlayerById(landlordId);
            landlord.isLandlord = true;
            landlord.hand = this.sortHand([...landlord.hand, ...this.landlordCards]);
            this.multiplier = this.biddingCycle.highestBid;
            this.currentTurnIndex = this.players.findIndex(p => p.id === landlordId);
            this.gameState = 'playing';
        } else {
            // Everyone passed, handle redeal scenario
            this.gameState = 'ended'; // Or some other state to indicate a failed round
        }
    }
    
    // Gameplay logic
    getCurrentPlayingPlayer() {
        return this.players[this.currentTurnIndex];
    }
    
    getPlayerById(playerId) {
        return this.players.find(p => p.id === playerId);
    }
    
    getWinner() {
        return this.players.find(p => p.hand.length === 0);
    }

    playCards(playerId, cardIds) {
        const player = this.getPlayerById(playerId);
        if (player.id !== this.getCurrentPlayingPlayer().id) return null;

        const cardsToPlay = player.hand.filter(c => cardIds.includes(c.id));
        if (cardsToPlay.length !== cardIds.length) return null;

        const cardType = this.getCardType(cardsToPlay);
        if (cardType.type === 'invalid') return null;

        if (this.lastValidPlay.playerId && this.lastValidPlay.playerId !== playerId) {
            const lastPlayType = this.getCardType(this.lastValidPlay.cards);
            if (!this.canBeat(cardType, lastPlayType)) return null;
        }

        player.hand = player.hand.filter(c => !cardIds.includes(c.id));
        player.playsCount++;
        this.lastValidPlay = { playerId, cards: cardsToPlay };
        this.passPlayCount = 0;
        this.currentTurnIndex = (this.currentTurnIndex + 1) % this.players.length;
        
        if (player.hand.length === 0) {
            this.gameState = 'ended';
        }

        return { playedCards: cardsToPlay, cardType: cardType };
    }

    passTurn(playerId) {
        if (playerId !== this.getCurrentPlayingPlayer().id) return false;
        if (!this.lastValidPlay.playerId) return false; // Cannot pass on the first play of a round

        this.passPlayCount++;
        this.currentTurnIndex = (this.currentTurnIndex + 1) % this.players.length;

        if (this.passPlayCount === this.players.length - 1) {
            // Everyone else passed, this player starts a new round
            this.lastValidPlay = { playerId: null, cards: [] };
            this.passPlayCount = 0;
        }
        return true;
    }

    // Card validation and comparison logic
    getCardType(cards) {
        // This is a simplified implementation. A real one would be much more complex.
        const len = cards.length;
        if (len === 0) return { type: 'invalid' };
        
        const ranks = cards.map(c => c.rank).sort((a,b)=>a-b);
        const firstRank = ranks[0];

        if (len === 1) return { type: 'single', rank: firstRank };
        if (len === 2 && ranks[0] === ranks[1]) return { type: 'pair', rank: firstRank };
        if (len === 4 && ranks[0] === ranks[3]) return { type: 'bomb', rank: firstRank };
        if (len === 2 && cards.every(c => c.value === 'joker')) return { type: 'rocket', rank: 99 }; // Rocket
        
        // Simplified straights
        let isStraight = true;
        for (let i = 1; i < len; i++) {
            if (ranks[i] !== ranks[i-1] + 1 || ranks[i] > 14) { // No 2s or jokers in straights
                isStraight = false;
                break;
            }
        }
        if(isStraight && len >= 5) return { type: 'straight', rank: firstRank, length: len };

        return { type: 'invalid' };
    }

    canBeat(currentPlay, lastPlay) {
        if (currentPlay.type === 'rocket') return true;
        if (lastPlay.type === 'rocket') return false;
        
        if (currentPlay.type === 'bomb') {
            if(lastPlay.type === 'bomb') return currentPlay.rank > lastPlay.rank;
            return true;
        }

        if (currentPlay.type === lastPlay.type && currentPlay.length === lastPlay.length && currentPlay.rank > lastPlay.rank) {
            return true;
        }

        return false;
    }

    // AI Logic
    aiSimplePlay(playerId) {
        // Super simple AI: find the smallest single card to play
        const player = this.getPlayerById(playerId);
        const hand = player.hand;

        if (!this.lastValidPlay.playerId) { // AI starts a new round
            return this.playCards(playerId, [hand[hand.length-1].id]); // Play smallest card
        }
        
        // Try to beat the last play
        const lastPlayType = this.getCardType(this.lastValidPlay.cards);
        
        // Simple AI: only tries to beat singles
        if (lastPlayType.type === 'single') {
            for(let i = hand.length - 1; i >= 0; i--) {
                const potentialPlay = { type: 'single', rank: hand[i].rank };
                if (this.canBeat(potentialPlay, lastPlayType)) {
                    return this.playCards(playerId, [hand[i].id]);
                }
            }
        }
        
        // Cannot beat, so pass
        return this.passTurn(playerId);
    }
    
    aiSimpleBid(playerId) {
        const player = this.getPlayerById(playerId);
        const goodCards = player.hand.filter(c => c.rank > 13).length; // Count Aces, 2s, Jokers
        
        if (goodCards > 4 && this.biddingCycle.highestBid < 3) return 3;
        if (goodCards > 3 && this.biddingCycle.highestBid < 2) return 2;
        if (goodCards > 2 && this.biddingCycle.highestBid < 1) return 1;
        
        return 0; // Pass
    }
}

// For use in other modules
export { DouDizhuGame };
