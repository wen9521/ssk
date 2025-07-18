/**
 * card-logic.js
 * 
 * 负责所有与牌型判断相关的纯函数。
 */

/**
 * 解析一手牌的类型和大小
 * @param {Array<object>} cards - 要解析的牌对象数组
 * @returns {object|null} - 如果是有效牌型，返回 { type, rank, name, cards }, 否则返回 null
 */
export function parseCardType(cards) {
    if (!cards || cards.length === 0) {
        return null;
    }

    const len = cards.length;
    const sortedRanks = cards.map(c => c.rank).sort((a, b) => a - b);
    const firstRank = sortedRanks[0];

    // --- 规则判断 ---

    // 1. 火箭：大小王
    if (len === 2 && sortedRanks.includes(98) && sortedRanks.includes(99)) {
        return { type: 'rocket', rank: 100, name: '火箭', cards };
    }

    // 2. 炸弹：四张同点数的牌
    if (len === 4 && sortedRanks.every(rank => rank === firstRank)) {
        return { type: 'bomb', rank: firstRank, name: '炸弹', cards };
    }

    // 3. 单牌
    if (len === 1) {
        return { type: 'single', rank: firstRank, name: '单张', cards };
    }
    
    // 4. 对子
    if (len === 2 && sortedRanks.every(rank => rank === firstRank)) {
        return { type: 'pair', rank: firstRank, name: '对子', cards };
    }

    // 5. 三不带
    if (len === 3 && sortedRanks.every(rank => rank === firstRank)) {
        return { type: 'trio', rank: firstRank, name: '三张', cards };
    }

    // --- 更多复杂牌型判断 (顺子、三带一、飞机等) ---
    // (这是一个巨大的逻辑块，这里先留空，未来可以逐步实现)
    
    // TODO: 实现顺子判断 (isStraight)
    // TODO: 实现连对判断 (isConsecutivePairs)
    // TODO: 实现飞机判断 (isAirplane)
    // TODO: 实现三带一、三带二判断
    // TODO: 实现四带二判断

    return null; // 如果不匹配任何已知牌型
}
