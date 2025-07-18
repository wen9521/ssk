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

        if (isFreePlay) {
            // 首轮，包含方块3的单张
            const card = player.hand.find(c => c.type === 'normal' && c.value.key === '3' && c.suit.key === 'diamonds');
            if (card) return this.playCards(aiPlayerId, [card.id]);
        }

        // AI：单张>对子>三张>炸弹，优先能大过上一家
        for (let size of [1, 2, 3, 4]) {
            let combos = this.findCardCombinations(player.hand, size);
            for (const combo of combos) {
                const potentialPlay = parseCardType(combo);
                if (potentialPlay && canPlayOver(potentialPlay, this.lastValidPlay.cardType)) {
                    return this.playCards(aiPlayerId, combo.map(c => c.id));
                }
            }
        }
        this.passTurn(aiPlayerId);
        return null;
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
