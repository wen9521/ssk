/**
 * card-logic.js (Refactored)
 *
 * 重构后的牌型判断逻辑。
 * 每个牌型判断都拆分为独立的、可测试的函数。
 * parseCardType按顺序调用这些函数，提高了代码的可读性和健arct Maintainability。
 */

// --- 辅助函数 ---

/**
 * 统计数组中各项出现的次数
 * @param {Array<number>} ranks - 牌点数数组
 * @returns {Map<number, number>} - 返回一个Map，键为点数，值为出现次数
 */
function getRankCounts(cards) {
    const counts = new Map();
    for (const card of cards) {
        counts.set(card.rank, (counts.get(card.rank) || 0) + 1);
    }
    return counts;
}

/**
 * 检查一组数字是否连续 (忽略2和大小王)
 * @param {Array<number>} ranks - 已排序的、不重复的牌点数数组
 * @returns {boolean}
 */
function isConsecutive(ranks) {
    if (!ranks || ranks.length <= 1) return true;
    if (ranks.some(rank => rank >= 14)) return false; // 2和王不能参与顺子
    for (let i = 0; i < ranks.length - 1; i++) {
        if (ranks[i] + 1 !== ranks[i + 1]) {
            return false;
        }
    }
    return true;
}


// --- 单个牌型判断函数 ---

function getSingle(cards, counts) {
    if (cards.length !== 1) return null;
    return { type: 'single', rank: cards[0].rank, name: '单张', cards };
}

function getPair(cards, counts) {
    if (cards.length !== 2) return null;
    if (counts.size === 1) {
        return { type: 'pair', rank: cards[0].rank, name: '对子', cards };
    }
    return null;
}

function getTrio(cards, counts) {
    if (cards.length !== 3) return null;
    if (counts.size === 1) {
        return { type: 'trio', rank: cards[0].rank, name: '三不带', cards };
    }
    return null;
}

function getBomb(cards, counts) {
    if (cards.length !== 4) return null;
    if (counts.size === 1) {
        return { type: 'bomb', rank: cards[0].rank, name: '炸弹', cards };
    }
    return null;
}

function getRocket(cards, counts) {
    if (cards.length !== 2) return null;
    if (counts.has(98) && counts.has(99)) {
        return { type: 'rocket', rank: 100, name: '火箭', cards };
    }
    return null;
}

function getStraight(cards, counts) {
    if (cards.length < 5) return null;
    if (counts.size !== cards.length) return null; // 确保没有重复的牌

    const ranks = [...counts.keys()].sort((a, b) => a - b);
    if (isConsecutive(ranks)) {
        return { type: 'straight', rank: ranks[0], name: '顺子', cards };
    }
    return null;
}

function getConsecutivePairs(cards, counts) {
    if (cards.length < 6 || cards.length % 2 !== 0) return null;
    if ([...counts.values()].some(count => count !== 2)) return null;

    const ranks = [...counts.keys()].sort((a, b) => a - b);
    if (isConsecutive(ranks)) {
        return { type: 'consecutive_pairs', rank: ranks[0], name: '连对', cards };
    }
    return null;
}

function getTrioWithAttachment(cards, counts) {
    if (cards.length < 4 || cards.length > 5) return null;
    
    let trioRank = -1;
    counts.forEach((count, rank) => {
        if (count === 3) {
            trioRank = rank;
        }
    });

    if (trioRank === -1) return null;

    if (cards.length === 4) { // 三带一
        return { type: 'trio_single', rank: trioRank, name: '三带一', cards };
    }
    if (cards.length === 5) { // 三带二 (一对)
        if ([...counts.values()].includes(2)) {
            return { type: 'trio_pair', rank: trioRank, name: '三带二', cards };
        }
    }
    return null;
}

function getFourWithAttachment(cards, counts) {
    if (cards.length !== 6 && cards.length !== 8) return null;

    let fourRank = -1;
    counts.forEach((count, rank) => {
        if (count === 4) {
            fourRank = rank;
        }
    });
    
    if (fourRank === -1) return null;

    if (cards.length === 6) { // 四带二 (任意两张单牌或一个对子)
        return { type: 'four_two_singles', rank: fourRank, name: '四带二', cards };
    }
    
    if (cards.length === 8) { // 四带两对
        let pairCount = 0;
        counts.forEach((count, rank) => {
            if (count === 2) {
                pairCount++;
            }
        });
        if (pairCount === 2) {
            return { type: 'four_two_pairs', rank: fourRank, name: '四带两对', cards };
        }
    }
    return null;
}

function getAirplane(cards, counts) {
    const trioRanks = [];
    counts.forEach((count, rank) => {
        if (count === 3) {
            trioRanks.push(rank);
        }
    });
    trioRanks.sort((a, b) => a - b);

    if (trioRanks.length < 2 || !isConsecutive(trioRanks)) return null;
    
    const numTrios = trioRanks.length;

    // 飞机不带翼
    if (cards.length === numTrios * 3 && counts.size === numTrios) {
        return { type: 'airplane', rank: trioRanks[0], name: '飞机', cards };
    }

    // 飞机带单翼
    if (cards.length === numTrios * 4) {
        const singleCount = cards.length - numTrios * 3;
        if (singleCount === numTrios) {
            return { type: 'airplane_singles', rank: trioRanks[0], name: '飞机带小翼', cards };
        }
    }

    // 飞机带对翼
    if (cards.length === numTrios * 5) {
        let pairCount = 0;
        counts.forEach(count => {
            if (count === 2) {
                pairCount++;
            }
        });
        if (pairCount === numTrios) {
            return { type: 'airplane_pairs', rank: trioRanks[0], name: '飞机带大翼', cards };
        }
    }
    
    return null;
}


// --- 主解析和比较函数 ---

const parsers = [
    getRocket,
    getBomb,
    getSingle,
    getPair,
    getTrio,
    getStraight,
    getConsecutivePairs,
    getTrioWithAttachment,
    getFourWithAttachment,
    getAirplane
];

/**
 * 解析一手牌的类型和大小 (主函数)
 * @param {Array<object>} cards - 要解析的牌对象数组
 * @returns {object|null} - 如果是有效牌型，返回 { type, rank, name, cards }, 否则返回 null
 */
export function parseCardType(cards) {
    if (!cards || cards.length === 0) {
        return null;
    }
    const counts = getRankCounts(cards);

    for (const parser of parsers) {
        const result = parser(cards, counts);
        if (result) return result;
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
    if (!lastPlay || !lastPlay.type) return true;

    // 规则1：火箭最大
    if (myPlay.type === 'rocket') return true;
    if (lastPlay.type === 'rocket') return false; // 对方是火箭，我不是，那我必输

    // 规则2：炸弹仅次于火箭
    if (myPlay.type === 'bomb') {
        if (lastPlay.type === 'bomb') return myPlay.rank > lastPlay.rank;
        return true; // 我的炸弹可以大过任何其他非炸弹牌型
    }
    // 如果对方是炸弹，而我不是，我必输
    if (lastPlay.type === 'bomb') return false;

    // 规则3：牌型必须相同
    if (myPlay.type !== lastPlay.type) return false;
    
    // 规则4：牌数量必须相同
    if (myPlay.cards.length !== lastPlay.cards.length) return false;

    // 规则5：比较点数大小
    return myPlay.rank > lastPlay.rank;
}
