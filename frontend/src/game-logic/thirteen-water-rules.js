/**
 * thirteen-water-rules.js
 * 
 * 十三水游戏的核心规则和状态机。
 * 简化：离线四人发牌，自动分墩，比点数，AI简单逻辑。
 */

import { createDeck, shuffle } from './deck.js';

export class ThirteenWaterGame {
    constructor(playerNames = ['您', 'AI-2', 'AI-3', 'AI-4']) {
        this.players = playerNames.map((name, idx) => ({
            id: `player-${idx}`,
            name,
            hand: [],
            groups: [[], [], []], // 三墩
            totalScore: 0,
        }));
        this.deck = [];
        this.gameState = 'pending';
    }

    startGame() {
        this.deck = shuffle(createDeck());
        for (let i = 0; i < 4; i++) {
            this.players[i].hand = this.deck.slice(i * 13, (i + 1) * 13);
            this.players[i].hand.sort((a, b) => b.rank - a.rank);
        }
        this.gameState = 'grouping';
    }

    autoGroup(playerId) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) return;
        // 简单分组：最大5张为头墩，其次5张为中墩，最小3张为尾墩
        player.groups = [
            player.hand.slice(0, 5),
            player.hand.slice(5, 10),
            player.hand.slice(10, 13),
        ];
    }

    compareAll() {
        // 所有玩家均已分组后，逐墩比大小，取牌rank总和为分
        for (let i = 0; i < 3; i++) {
            let scores = this.players.map(p => ({
                player: p,
                sum: p.groups[i].reduce((s, c) => s + c.rank, 0)
            }));
            scores.sort((a, b) => b.sum - a.sum);
            scores[0].player.totalScore += 2;
            scores[1].player.totalScore += 1;
        }
        this.gameState = 'ended';
        return this.players.map(p => ({ name: p.name, score: p.totalScore }));
    }
}
