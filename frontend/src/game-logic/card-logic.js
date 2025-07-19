// 斗地主牌型判断和比较

function getRankCounts(cards) {
    const counts = new Map();
    for (const card of cards) {
        counts.set(card.rank, (counts.get(card.rank) || 0) + 1);
    }
    return counts;
}

function isConsecutive(ranks) {
    if (!ranks || ranks.length <= 1) return true;
    if (ranks.some(rank => rank >= 14)) return false;
    for (let i = 0; i < ranks.length - 1; i++) {
        if (ranks[i] + 1 !== ranks[i + 1]) {
            return false;
        }
    }
    return true;
}

// 基础牌型
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
    if (counts.size !== cards.length) return null;
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
        if (count === 3) trioRank = rank;
    });
    if (trioRank === -1) return null;
    if (cards.length === 4) return { type: 'trio_single', rank: trioRank, name: '三带一', cards };
    if (cards.length === 5 && [...counts.values()].includes(2)) {
        return { type: 'trio_pair', rank: trioRank, name: '三带二', cards };
    }
    return null;
}
function getFourWithAttachment(cards, counts) {
    let fourRank = -1;
    counts.forEach((count, rank) => {
        if (count === 4) fourRank = rank;
    });
    if (fourRank === -1) return null;
    // 四带二单
    if (cards.length === 6) {
        const singles = cards.filter(c => c.rank !== fourRank);
        if (singles.length === 2 && singles[0].rank !== singles[1].rank) {
            return { type: 'four_two_singles', rank: fourRank, name: '四带二', cards };
        }
    }
    // 四带两对
    if (cards.length === 8) {
        const pairs = cards.filter(c => c.rank !== fourRank);
        const countsPairs = getRankCounts(pairs);
        if ([...countsPairs.values()].every(count => count === 2)) {
            return { type: 'four_two_pairs', rank: fourRank, name: '四带两对', cards };
        }
    }
    return null;
}
function getAirplane(cards, counts) {
    const trioRanks = [];
    counts.forEach((count, rank) => {
        if (count === 3) trioRanks.push(rank);
    });
    trioRanks.sort((a, b) => a - b);
    if (trioRanks.length < 2 || !isConsecutive(trioRanks)) return null;
    const numTrios = trioRanks.length;
    // 飞机不带
    if (cards.length === numTrios * 3 && counts.size === numTrios) {
        return { type: 'airplane', rank: trioRanks[0], name: '飞机', cards };
    }
    // 飞机带单（小翼）
    if (cards.length === numTrios * 4) {
        const wings = cards.filter(c => trioRanks.indexOf(c.rank) === -1);
        if (wings.length === numTrios && wings.every((c, i, arr) => arr.filter(x=>x.rank===c.rank).length===1)) {
            return { type: 'airplane_singles', rank: trioRanks[0], name: '飞机带小翼', cards };
        }
    }
    // 飞机带对（大翼）
    if (cards.length === numTrios * 5) {
        const wings = cards.filter(c => trioRanks.indexOf(c.rank) === -1);
        if (wings.length === numTrios * 2 && wings.every((c, i, arr) => arr.filter(x=>x.rank===c.rank).length===2)) {
            return { type: 'airplane_pairs', rank: trioRanks[0], name: '飞机带大翼', cards };
        }
    }
    return null;
}

const parsers = [
    getRocket,
    getBomb,
    getAirplane,
    getSingle,
    getPair,
    getTrio,
    getStraight,
    getConsecutivePairs,
    getTrioWithAttachment,
    getFourWithAttachment
];

export function parseCardType(cards) {
    if (!cards || cards.length === 0) return null;
    const counts = getRankCounts(cards);
    for (const parser of parsers) {
        const result = parser(cards, counts);
        if (result) return result;
    }
    return null;
}

export function canPlayOver(myPlay, lastPlay) {
    if (!myPlay) return false;
    if (!lastPlay || !lastPlay.type) return true;
    if (myPlay.type === 'rocket') return true;
    if (lastPlay.type === 'rocket') return false;
    if (myPlay.type === 'bomb') {
        if (lastPlay.type === 'bomb') return myPlay.rank > lastPlay.rank;
        return true;
    }
    if (lastPlay.type === 'bomb') return false;
    if (myPlay.type !== lastPlay.type) return false;
    if (myPlay.cards.length !== lastPlay.cards.length) return false;
    return myPlay.rank > lastPlay.rank;
}
