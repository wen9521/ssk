/**
 * big-two-rules.js
 * 
 * 锄大地游戏的核心规则和状态机。四人，首出方块3，轮流出牌。
 */

import { createDeck, shuffle } from './deck.js';
import { parseCardType, canPlayOver } from './card-logic.js';

export class BigTwoGame {
    constructor(playerNames = ['您', 'AI-2', 'AI-3', 'AI-4']) {
        this.players = playerNames.map((name, idx) => ({
            id: `player-${idx}`,
            name,
            hand: [],
            isWinner: false,
        }));
        this.deck = [];
        this.playTurn = 0;
        this.lastValidPlay = { playerId: null, cardType: null };
        this.passPlayCount = 0;
        this.winners = [];
        this.gameState = 'pending';
    }

    startGame() {
        this.deck = shuffle(createDeck());
        // 四人均分牌
        for (let i = 0; i < 4; i++) {
            this.players[i].hand = this.deck.slice(i * 13, (i + 1) * 13);
            this.players[i].hand.sort((a, b) => b.rank - a.rank);
            this.players[i].isWinner = false;
        }
        this.playTurn = this.findFirst3();
        this.lastValidPlay = { playerId: null, cardType: null };
        this.passPlayCount = 0;
        this.winners = [];
        this.gameState = 'playing';
    }

    findFirst3() {
        // 首出方块3
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].hand.some(c => c.type === 'normal' && c.value.key === '3' && c.suit.key === 'diamonds')) {
                return i;
            }
        }
        return 0;
    }

    playCards(playerId, cardIds) {
        if (this.players[this.playTurn].id !== playerId) return null;
        const player = this.players[this.playTurn];
        const cardsToPlay = player.hand.filter(c => cardIds.includes(c.id));
        if (cardsToPlay.length !== cardIds.length) return null;

        const myPlayType = parseCardType(cardsToPlay);
        if (!myPlayType) return null;

        // 首轮必须出方块3
        if (!this.lastValidPlay.cardType) {
            if (!cardsToPlay.some(c => c.type === 'normal' && c.value.key === '3' && c.suit.key === 'diamonds')) return null;
        } else {
            if (!canPlayOver(myPlayType, this.lastValidPlay.cardType)) return null;
        }

        player.hand = player.hand.filter(c => !cardIds.includes(c.id));
        this.lastValidPlay = { playerId, cardType: myPlayType };
        this.passPlayCount = 0;

        if (player.hand.length === 0) {
            player.isWinner = true;
            this.winners.push(player);
            if (this.winners.length === 3) {
                this.gameState = 'ended';
            }
        }
        this.nextPlayTurn();
        return { playedCards: cardsToPlay, cardType: myPlayType };
    }

    passTurn(playerId) {
        if (this.players[this.playTurn].id !== playerId) return false;
        this.passPlayCount++;
        if (this.passPlayCount >= this.players.length - this.winners.length - 1) {
            this.lastValidPlay = { playerId: null, cardType: null };
            this.passPlayCount = 0;
        }
        this.nextPlayTurn();
        return true;
    }

    nextPlayTurn() {
        do {
            this.playTurn = (this.playTurn + 1) % this.players.length;
        } while (this.players[this.playTurn].isWinner);
    }

    aiSimplePlay(aiPlayerId) {
        const player = this.players.find(p => p.id === aiPlayerId);
        if (!player || player.isWinner) return null;
        const isFreePlay = !this.lastValidPlay.cardType;

        const allPossiblePlays = this.findAllPlays(player.hand);

        if (isFreePlay) {
            // 首轮，必须出包含方块3的组合
            const firstTurnPlays = allPossiblePlays.filter(p => p.cards.some(c => c.type === 'normal' && c.value.key === '3' && c.suit.key === 'diamonds'));
            if (firstTurnPlays.length > 0) {
                 // 优先出顺子或同花
                 const preferredPlay = firstTurnPlays.find(p => p.type === 'straight' || p.type === 'flush') || firstTurnPlays[0];
                 return this.playCards(aiPlayerId, preferredPlay.cards.map(c => c.id));
            }
        }

        const validPlays = allPossiblePlays.filter(play => canPlayOver(play, this.lastValidPlay.cardType));
        if (validPlays.length > 0) {
            // 优先出最小的能压过的牌
            validPlays.sort((a, b) => a.rank - b.rank);
            return this.playCards(aiPlayerId, validPlays[0].cards.map(c => c.id));
        }
        
        this.passTurn(aiPlayerId);
        return null;
    }

    findAllPlays(hand) {
        let plays = [];
        const rankCounts = new Map();
        const suitCounts = new Map();
        hand.forEach(c => {
            rankCounts.set(c.rank, (rankCounts.get(c.rank) || 0) + 1);
            if (c.type === 'normal') {
                suitCounts.set(c.suit.key, (suitCounts.get(c.suit.key) || 0) + 1);
            }
        });

        // 找出所有单张、对子、三条
        rankCounts.forEach((count, rank) => {
            const cards = hand.filter(c => c.rank === rank);
            if (count >= 1) plays.push(parseCardType([cards[0]]));
            if (count >= 2) plays.push(parseCardType(cards.slice(0, 2)));
            if (count >= 3) plays.push(parseCardType(cards.slice(0, 3)));
        });

        // 找出所有5张牌的组合
        const fiveCardCombos = this.findCardCombinations(hand, 5);
        fiveCardCombos.forEach(combo => {
            const play = parseCardType(combo);
            if (play && ['straight', 'flush', 'full_house', 'four_of_a_kind', 'straight_flush'].includes(play.type)) {
                plays.push(play);
            }
        });

        return plays.filter(p => p);
    }


    findCardCombinations(hand, size) {
        const result = [];
        function combine(start, currentCombo) {
            if (currentCombo.length === size) {
                result.push(currentCombo);
                return;
            }
            if (start === hand.length) return;
            combine(start + 1, [...currentCombo, hand[start]]);
            combine(start + 1, currentCombo);
        }
        combine(0, []);
        return result;
    }
}
