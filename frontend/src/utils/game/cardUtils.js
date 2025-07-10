// src/utils/game/cardUtils.js

// [重构] 这是唯一的、权威的卡牌和游戏规则工具文件。
// [新增] 添加了 compareHands 和 isFoul 函数，并强化了 getHandType。

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUITS = ['♠', '♥', '♦', '♣'];

export function createDeck() { /* ... (无变化) ... */ }
export function shuffleDeck(deck) { /* ... (无变化) ... */ }
export function getRank(card) { /* ... (无变化) ... */ }
export function getSuit(card) { /* ... (无变化) ... */ }
export function dealCards(numPlayers = 4) { /* ... (无变化) ... */ }

// --- 以下是新增和修改的核心逻辑 ---

/**
 * [强化] 强大的牌型判断函数
 * @param {string[]} cards - 一组牌
 * @returns {string} 牌型名称
 */
export function getHandType(cards) {
    if (!cards || !Array.isArray(cards) || cards.length === 0) return "无";
    
    const ranks = cards.map(getRank).sort((a, b) => a - b);
    const suits = cards.map(getSuit);

    const rankCounts = ranks.reduce((acc, rank) => { acc[rank] = (acc[rank] || 0) + 1; return acc; }, {});
    const counts = Object.values(rankCounts);
    
    const isFlush = new Set(suits).size === 1;
    const isStraight = (() => {
        const uniqueRanks = [...new Set(ranks)];
        if (uniqueRanks.length !== cards.length) return false;
        if (uniqueRanks[uniqueRanks.length - 1] - uniqueRanks[0] === cards.length - 1) return true;
        // A-5 顺子: [2, 3, 4, 5, 14]
        if (JSON.stringify(uniqueRanks) === JSON.stringify([2, 3, 4, 5, 14])) return true;
        return false;
    })();
    
    if (cards.length === 5) {
        if (isStraight && isFlush) return "同花顺";
        if (counts.includes(4)) return "铁支";
        if (counts.includes(3) && counts.includes(2)) return "葫芦";
        if (isFlush) return "同花";
        if (isStraight) return "顺子";
    }

    if (counts.includes(3)) return "三条";
    if (counts.filter(c => c === 2).length === 2) return "两对";
    if (counts.includes(2)) return "对子";
    
    return "散牌";
}

/**
 * [新增] 比较两手牌大小（在牌型相同时调用）
 * @returns {number} 1: hand1 > hand2, -1: hand1 < hand2, 0: a === b
 */
export function compareHands(hand1, hand2) {
    const ranks1 = hand1.map(getRank).sort((a, b) => b - a);
    const ranks2 = hand2.map(getRank).sort((a, b) => b - a);
    for (let i = 0; i < ranks1.length; i++) {
        if (ranks1[i] !== ranks2[i]) {
            return ranks1[i] > ranks2[i] ? 1 : -1;
        }
    }
    return 0;
}

/**
 * [新增] 权威的“倒水”判断函数
 * @returns {boolean} true 如果倒水, false 如果没有
 */
export function isFoul(dun1, dun2, dun3) {
    if (!dun1 || !dun2 || !dun3 || dun1.length !== 3 || dun2.length !== 5 || dun3.length !== 5) {
      // 牌张数不全，不算倒水，但认为是无效状态
      return false; 
    }

    const handTypes = ["散牌", "对子", "两对", "三条", "顺子", "同花", "葫芦", "铁支", "同花顺"];
    
    const type1 = getHandType(dun1);
    const type2 = getHandType(dun2);
    const type3 = getHandType(dun3);

    const rank1 = handTypes.indexOf(type1);
    const rank2 = handTypes.indexOf(type2);
    const rank3 = handTypes.indexOf(type3);

    if (rank1 > rank2 || rank2 > rank3) {
        return true;
    }

    if (rank1 === rank2 && compareHands(dun1, dun2) > 0) {
        return true;
    }

    if (rank2 === rank3 && compareHands(dun2, dun3) > 0) {
        return true;
    }

    return false;
}
