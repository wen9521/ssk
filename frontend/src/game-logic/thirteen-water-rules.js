// Extended Thirteen Water Game Logic

import { Deck } from './deck.js';

// --- 卡牌和牌型定义 ---
const SUITS = ['spades', 'hearts', 'clubs', 'diamonds'];
const RANKS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]; // J=11, Q=12, K=13, A=14

// ... (基础卡牌工具函数: getCardValue, getCardName - 保持不变)

// --- 核心牌型判断函数 ---
export function getHandType(hand) {
    if (!hand || hand.length === 0) return { type: 'invalid', rank: 0, name: '无' };
    
    const len = hand.length;
    const ranks = hand.map(c => c.rank).sort((a, b) => a - b);
    const suits = hand.map(c => c.suit);
    const isFlush = new Set(suits).size === 1;
    const isStraight = ranks.every((rank, i) => i === 0 || rank === ranks[i - 1] + 1) || 
                       JSON.stringify(ranks) === JSON.stringify([2,3,4,5,14]); // A-2-3-4-5 特殊顺子

    const rankCounts = ranks.reduce((acc, rank) => {
        acc[rank] = (acc[rank] || 0) + 1;
        return acc;
    }, {});
    const counts = Object.values(rankCounts).sort((a, b) => b - a);
    const primaryRank = parseInt(Object.keys(rankCounts).find(k => rankCounts[k] === counts[0]));

    if (len === 5) {
        if (isStraight && isFlush) return { type: 'straight-flush', rank: 9, name: '同花顺', primaryRank: ranks[4] };
        if (counts[0] === 4) return { type: 'four-of-a-kind', rank: 8, name: '铁支', primaryRank };
        if (counts[0] === 3 && counts[1] === 2) return { type: 'full-house', rank: 7, name: '葫芦', primaryRank };
        if (isFlush) return { type: 'flush', rank: 6, name: '同花', primaryRank: ranks[4] };
        if (isStraight) return { type: 'straight', rank: 5, name: '顺子', primaryRank: ranks[4] };
        if (counts[0] === 3) return { type: 'three-of-a-kind', rank: 4, name: '三条', primaryRank };
        if (counts[0] === 2 && counts[1] === 2) return { type: 'two-pair', rank: 3, name: '两对', primaryRank: Math.max(...Object.keys(rankCounts).filter(k => rankCounts[k] === 2).map(Number)) };
        if (counts[0] === 2) return { type: 'one-pair', rank: 2, name: '对子', primaryRank };
        return { type: 'high-card', rank: 1, name: '乌龙', primaryRank: ranks[4] };
    }
    if (len === 3) {
        if (counts[0] === 3) return { type: 'three-of-a-kind', rank: 4, name: '冲三', primaryRank };
        if (counts[0] === 2) return { type: 'one-pair', rank: 2, name: '对子', primaryRank };
        return { type: 'high-card', rank: 1, name: '乌龙', primaryRank: ranks[2] };
    }
    return { type: 'invalid', rank: 0, name: '无效牌型' };
}

function compareHands(handA, handB) {
    const typeA = getHandType(handA);
    const typeB = getHandType(handB);
    if (typeA.rank !== typeB.rank) return typeA.rank > typeB.rank ? 1 : -1;
    
    // 同牌型比大小
    if (typeA.primaryRank !== typeB.primaryRank) return typeA.primaryRank > typeB.primaryRank ? 1 : -1;

    // 还比不出来，逐张比
    const ranksA = handA.map(c => c.rank).sort((a, b) => b - a);
    const ranksB = handB.map(c => c.rank).sort((a, b) => b - a);
    for (let i = 0; i < ranksA.length; i++) {
        if (ranksA[i] !== ranksB[i]) return ranksA[i] > ranksB[i] ? 1 : -1;
    }
    return 0; // 完全相同
}

// 导出isFoul函数，用于实时检查
export function isFoul(head, middle, tail) {
    if (head.length !== 3 || middle.length !== 5 || tail.length !== 5) return false; // 未完成理牌，不算倒水
    return compareHands(head, middle) > 0 || compareHands(middle, tail) > 0;
}


// --- 游戏主类 ---
export class ThirteenWaterGame {
    constructor(playerNames) {
        this.players = playerNames.map((name, i) => ({
            id: `player-${i}`,
            name: name,
            hand: [],
            groups: [], // [head, middle, tail]
            isFoul: false,
        }));
        this.deck = new Deck(SUITS, RANKS);
    }

    startGame() {
        this.deck.shuffle();
        const hands = this.deck.deal(this.players.length, 13);
        this.players.forEach((player, i) => player.hand = hands[i]);
    }

    // --- 智能分牌核心逻辑 ---
    getAllSmartSplits(playerId) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) return [];
        // 这里只是一个简单的实现，返回几种预设的分法
        // 实际开发中会用更复杂的算法
        const sortedHand = [...player.hand].sort((a, b) => b.rank - a.rank);
        
        // 方案1: 默认分法
        const split1 = {
            head: sortedHand.slice(0, 3),
            middle: sortedHand.slice(3, 8),
            tail: sortedHand.slice(8, 13)
        };
        
        // 方案2: 尝试凑大尾墩
        const split2 = {
             tail: sortedHand.slice(0, 5),
             middle: sortedHand.slice(5, 10),
             head: sortedHand.slice(10, 13)
        };
        
        // 方案3: 尝试强头墩
        const split3 = {
            head: sortedHand.slice(player.hand.length - 3),
            middle: sortedHand.slice(0, 5),
            tail: sortedHand.slice(5, 10)
        };

        // 过滤掉会导致倒水的方案
        return [split1, split2, split3].filter(s => !isFoul(s.head, s.middle, s.tail));
    }
    
    autoGroup(playerId) {
        const splits = this.getAllSmartSplits(playerId);
        if(splits.length > 0) {
            const player = this.players.find(p => p.id === playerId);
            player.groups = [splits[0].head, splits[0].middle, splits[0].tail];
        }
    }
    
    // --- 比牌和计分 ---
    compareAll() {
        // 1. 判定倒水
        this.players.forEach(p => {
            p.isFoul = isFoul(p.groups[0], p.groups[1], p.groups[2]);
        });

        // 2. 计算基础分
        const scores = this.players.map(() => 0);
        for (let i = 0; i < this.players.length; i++) {
            for (let j = i + 1; j < this.players.length; j++) {
                const p1 = this.players[i];
                const p2 = this.players[j];
                let p1Score = 0;

                if (p1.isFoul && p2.isFoul) { /* 双方都倒水，不计分 */ } 
                else if (p1.isFoul) { p1Score = -3; } 
                else if (p2.isFoul) { p1Score = 3; } 
                else {
                    p1Score += compareHands(p1.groups[0], p2.groups[0]); // 头
                    p1Score += compareHands(p1.groups[1], p2.groups[1]); // 中
                    p1Score += compareHands(p1.groups[2], p2.groups[2]); // 尾
                }
                scores[i] += p1Score;
                scores[j] -= p1Score;
            }
        }
        
        // 3. 计算特殊牌型加分（未实现）

        // 4. 计算打枪和全垒打
        const finalResults = this.players.map((p, i) => ({ 
            playerId: p.id,
            name: p.name, 
            totalScore: scores[i],
            isFoul: p.isFoul,
            specialScores: {
                isGunner: false,
                gunTargets: [],
                isGrandSlam: false
            }
        }));

        for (let i = 0; i < this.players.length; i++) {
            let winCount = 0;
            let gunTargets = [];
            for (let j = 0; j < this.players.length; j++) {
                if (i === j) continue;
                 const p1 = this.players[i];
                 const p2 = this.players[j];
                 if (!p1.isFoul && !p2.isFoul) {
                    const headScore = compareHands(p1.groups[0], p2.groups[0]);
                    const middleScore = compareHands(p1.groups[1], p2.groups[1]);
                    const tailScore = compareHands(p1.groups[2], p2.groups[2]);
                    if (headScore > 0 && middleScore > 0 && tailScore > 0) {
                        finalResults[i].totalScore += 3; // 基础分上额外加3
                        finalResults[j].totalScore -= 3;
                        gunTargets.push(p2.name);
                    }
                 }
            }
            if(gunTargets.length > 0) {
                 finalResults[i].specialScores.isGunner = true;
                 finalResults[i].specialScores.gunTargets = gunTargets;
            }
            if (gunTargets.length === this.players.length -1) {
                finalResults[i].specialScores.isGrandSlam = true;
                // 全垒打分数翻倍
                finalResults[i].totalScore *= 2; 
                 for (let k = 0; k < this.players.length; k++) {
                     if (i !== k) finalResults[k].totalScore *= 2;
                 }
            }
        }

        return finalResults;
    }
}
