/**
 * thirteen-water-rules.js
 * 
 * 十三水游戏的核心规则和状态机。
 * 简化：离线四人发牌，自动分墩，比点数，AI简单逻辑。
 */

import { createDeck, shuffle } from './deck.js';

const CardTypes = {
    HIGH_CARD: 0,
    PAIR: 1,
    TWO_PAIR: 2,
    THREE_OF_A_KIND: 3,
    STRAIGHT: 4,
    FLUSH: 5,
    FULL_HOUSE: 6,
    FOUR_OF_A_KIND: 7,
    STRAIGHT_FLUSH: 8,
};

function getCardType(hand) {
    if (hand.length === 0) return { type: -1, rank: 0 };
    const ranks = hand.map(c => c.rank).sort((a, b) => a - b);
    const suits = hand.map(c => c.suit.key);
    const isFlush = new Set(suits).size === 1;
    
    let isStraight = false;
    // A-2-3-4-5 is a straight, but A is rank 12. Handle this special case.
    const uniqueRanks = [...new Set(ranks)];
    if (uniqueRanks.length >= 5) {
        if (uniqueRanks[uniqueRanks.length - 1] - uniqueRanks[0] === 4) {
            isStraight = true;
        } else if (uniqueRanks.toString() === '2,3,4,12') { // A,2,3,4,5
             isStraight = true;
             // For comparison, treat Ace as low in this specific straight
             ranks[ranks.length-1] = 1; // Temporarily change Ace's rank
             ranks.sort((a, b) => a-b);
        }
    }


    if (isStraight && isFlush) return { type: CardTypes.STRAIGHT_FLUSH, rank: ranks[ranks.length - 1] };
    
    const rankCounts = new Map();
    ranks.forEach(r => rankCounts.set(r, (rankCounts.get(r) || 0) + 1));
    const counts = [...rankCounts.values()].sort((a, b) => b - a);
    
    if (counts[0] === 4) return { type: CardTypes.FOUR_OF_A_KIND, rank: [...rankCounts.keys()].find(k => rankCounts.get(k) === 4) };
    if (counts[0] === 3 && counts[1] === 2) return { type: CardTypes.FULL_HOUSE, rank: [...rankCounts.keys()].find(k => rankCounts.get(k) === 3) };
    if (isFlush) return { type: CardTypes.FLUSH, rank: ranks[ranks.length - 1] };
    if (isStraight) return { type: CardTypes.STRAIGHT, rank: ranks[ranks.length - 1] };
    if (counts[0] === 3) return { type: CardTypes.THREE_OF_A_KIND, rank: [...rankCounts.keys()].find(k => rankCounts.get(k) === 3) };
    if (counts[0] === 2 && counts[1] === 2) return { type: CardTypes.TWO_PAIR, rank: Math.max(...[...rankCounts.keys()].filter(k => rankCounts.get(k) === 2)) };
    if (counts[0] === 2) return { type: CardTypes.PAIR, rank: [...rankCounts.keys()].find(k => rankCounts.get(k) === 2) };
    
    return { type: CardTypes.HIGH_CARD, rank: ranks[ranks.length - 1] };
}

function compareHands(hand1, hand2) {
    const type1 = getCardType(hand1);
    const type2 = getCardType(hand2);
    return type1.type > type2.type || (type1.type === type2.type && type1.rank > type2.rank);
}

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
        }
        this.gameState = 'grouping';
    }

    autoGroup(playerId) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) return;

        // A more sophisticated auto-grouping logic
        // This is a simplified heuristic approach. A full search is too complex.
        const hand = [...player.hand];
        let bestGrouping = {
            groups: [hand.slice(10, 13), hand.slice(5, 10), hand.slice(0, 5)],
            score: -Infinity
        };

        // Simplified: Find best 5-card, then best 5-card, then last 3, check validity
        const combos5 = this.findCardCombinations(hand, 5);
        
        for (const back of combos5) {
            const remaining8 = hand.filter(c => !back.includes(c));
            const combos5mid = this.findCardCombinations(remaining8, 5);

            for (const middle of combos5mid) {
                const front = remaining8.filter(c => !middle.includes(c));
                
                // Check if this grouping is valid
                if (compareHands(back, middle) && compareHands(middle, front)) {
                    // This is just one valid grouping. A real AI would score them.
                    // For this implementation, the first valid one we find is good enough.
                    player.groups = [front, middle, back];
                    return;
                }
            }
        }
        
        // Fallback to the simplest grouping if no valid combo found
        player.groups = bestGrouping.groups;
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


    compareAll() {
        this.players.forEach(p1 => {
            this.players.forEach(p2 => {
                if (p1.id >= p2.id) return;

                let score = 0;
                for (let i = 0; i < 3; i++) {
                    if (compareHands(p1.groups[i], p2.groups[i])) {
                        score++;
                    } else {
                        score--;
                    }
                }

                if (Math.abs(score) === 3) { // 打枪
                    score *= 2;
                }

                p1.totalScore += score;
                p2.totalScore -= score;
            });
        });

        this.gameState = 'ended';
        return this.players.map(p => ({ name: p.name, score: p.totalScore }));
    }
}
