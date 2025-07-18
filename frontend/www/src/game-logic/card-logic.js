/**
 * card-logic.js
 * 
 * 负责所有与牌型判断、比较相关的纯函数。
 * 增加了完整的斗地主牌型判断逻辑。
 */

/**
 * 检查一组数字是否连续 (忽略2和大小王)
 * @param {Array<number>} ranks - 已排序的、不重复的牌点数数组
 * @returns {boolean}
 */
function isConsecutive(ranks) {
    if (ranks.some(rank => rank >= 14)) { // 14是2, 98/99是大小王
        return false;
    }
    for (let i = 0; i < ranks.length - 1; i++) {
        if (ranks[i] + 1 !== ranks[i + 1]) {
            return false;
        }
    }
    return true;
}

/**
 * 统计数组中各项出现的次数
 * @param {Array<number>} ranks - 牌点数数组
 * @returns {Map<number, number>} - 返回一个Map，键为点数，值为出现次数
 */
function getRankCounts(ranks) {
    const counts = new Map();
    for (const rank of ranks) {
        counts.set(rank, (counts.get(rank) || 0) + 1);
    }
    return counts;
}

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
    // 使用Set来获取不重复的点数，并排序
    const uniqueRanks = [...new Set(cards.map(c => c.rank))].sort((a, b) => a - b);
    const counts = getRankCounts(cards.map(c => c.rank));
    
    // --- 单个牌型 ---
    if (len === 1) {
        return { type: 'single', rank: uniqueRanks[0], name: '单张', cards };
    }
    if (len === 2 && uniqueRanks.length === 1) {
        return { type: 'pair', rank: uniqueRanks[0], name: '对子', cards };
    }
    if (len === 3 && uniqueRanks.length === 1) {
        return { type: 'trio', rank: uniqueRanks[0], name: '三不带', cards };
    }
    if (len === 2 && uniqueRanks[0] === 98 && uniqueRanks[1] === 99) {
        return { type: 'rocket', rank: 100, name: '火箭', cards };
    }
    if (len === 4 && uniqueRanks.length === 1) {
        return { type: 'bomb', rank: uniqueRanks[0], name: '炸弹', cards };
    }

    // --- 顺子、连对、飞机 ---
    const isStraight = isConsecutive(uniqueRanks);
    if (isStraight) {
        // 顺子: 5张或以上，所有牌都只出现1次
        if (len >= 5 && len === uniqueRanks.length && counts.size === len) {
            return { type: 'straight', rank: uniqueRanks[0], name: '顺子', cards };
        }
        // 连对: 3对或以上，所有牌都出现2次
        if (len >= 6 && len % 2 === 0 && counts.size === len / 2 && [...counts.values()].every(c => c === 2)) {
            return { type: 'consecutive_pairs', rank: uniqueRanks[0], name: '连对', cards };
        }
        // 飞机不带翼: 2个或以上三张，所有牌都出现3次
        const trioRanks = uniqueRanks.filter(r => counts.get(r) === 3);
        if (len >= 6 && len % 3 === 0 && isConsecutive(trioRanks) && trioRanks.length === len / 3) {
            return { type: 'airplane', rank: trioRanks[0], name: '飞机', cards };
        }
    }

    // --- 带牌组合 (三带, 四带, 飞机带翼) ---
    const mainRanks = new Map(); // 主牌: 出现3次或4次的牌
    const kickerRanks = new Map(); // 飞机翼: 出现1次或2次的牌

    counts.forEach((count, rank) => {
        if (count >= 3) {
            mainRanks.set(rank, count);
        } else {
            kickerRanks.set(rank, count);
        }
    });

    if (mainRanks.size === 1) { // 只有一个主牌 (三带或四带)
        const [[mainRank, mainCount]] = mainRanks.entries();
        const kickerCount = [...kickerRanks.values()].reduce((sum, val) => sum + val, 0);

        // 三带一: 3+1
        if (mainCount === 3 && kickerCount === 1 && len === 4) {
            return { type: 'trio_single', rank: mainRank, name: '三带一', cards };
        }
        // 三带二: 3+2 (必须是带一对)
        if (mainCount === 3 && kickerCount === 2 && kickerRanks.size === 1 && len === 5) {
            return { type: 'trio_pair', rank: mainRank, name: '三带二', cards };
        }
        // 四带二单: 4+1+1
        if (mainCount === 4 && kickerCount === 2 && kickerRanks.size === 2 && len === 6) {
            return { type: 'four_two_singles', rank: mainRank, name: '四带二', cards };
        }
         // 四带二对: 4+2+2
        if (mainCount === 4 && kickerCount === 4 && kickerRanks.size === 2 && [...kickerRanks.values()].every(c => c === 2) && len === 8) {
            return { type: 'four_two_pairs', rank: mainRank, name: '四带两对', cards };
        }
    } else if (mainRanks.size > 1) { // 多个主牌 (飞机带翼)
        const sortedMainRanks = [...mainRanks.keys()].sort((a, b) => a - b);
        if (isConsecutive(sortedMainRanks) && [...mainRanks.values()].every(c => c === 3)) {
            const numTrios = sortedMainRanks.length;
            const singleKickers = [...kickerRanks.values()].filter(c => c === 1).length;
            const pairKickers = [...kickerRanks.values()].filter(c => c === 2).length;

            // 飞机带单翼: 333444 + 5 + 6
            if (singleKickers === numTrios && pairKickers === 0 && len === numTrios * 4) {
                return { type: 'airplane_singles', rank: sortedMainRanks[0], name: '飞机带小翼', cards };
            }
            // 飞机带对翼: 333444 + 77 + 88
            if (pairKickers === numTrios && singleKickers === 0 && len === numTrios * 5) {
                return { type: 'airplane_pairs', rank: sortedMainRanks[0], name: '飞机带大翼', cards };
            }
        }
    }
    
    return null; // 不匹配任何已知牌型
}

/**
 * 比较两手牌的大小
 * @param {object} myPlay - 我的出牌, parseCardType的返回结果
 * @param {object} lastPlay - 上一家的出牌, parseCardType的返回结果
 * @returns {boolean} - 如果我的牌能大过上一家，返回true
 */
export function canPlayOver(myPlay, lastPlay) {
    if (!myPlay) return false;
    // 如果上家没出牌，只要我的牌型有效即可
    if (!lastPlay) return true;

    // 规则1：火箭最大
    if (myPlay.type === 'rocket') return true;

    // 规则2：炸弹仅次于火箭
    if (myPlay.type === 'bomb') {
        if (lastPlay.type === 'rocket') return false;
        if (lastPlay.type === 'bomb') return myPlay.rank > lastPlay.rank;
        return true; // 炸弹可以大过任何其他非炸弹牌型
    }

    // 规则3：牌型必须相同
    if (myPlay.type !== lastPlay.type) return false;
    
    // 规则4：牌数量必须相同 (主要针对顺子、连对、飞机)
    if (myPlay.cards.length !== lastPlay.cards.length) return false;

    // 规则5：比较点数大小
    return myPlay.rank > lastPlay.rank;
}
