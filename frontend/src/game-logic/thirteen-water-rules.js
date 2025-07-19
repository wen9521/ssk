import { createDeck, shuffle } from './deck.js';

// 普通牌型定义
const CardTypes = {
    HIGH_CARD: { value: 0, name: '乌龙' },
    PAIR: { value: 1, name: '对子' },
    TWO_PAIR: { value: 2, name: '两对' },
    THREE_OF_A_KIND: { value: 3, name: '三条' },
    STRAIGHT: { value: 4, name: '顺子' },
    FLUSH: { value: 5, name: '同花' },
    FULL_HOUSE: { value: 6, name: '葫芦' },
    FOUR_OF_A_KIND: { value: 7, name: '铁支' },
    STRAIGHT_FLUSH: { value: 8, name: '同花顺' },
};

// 特殊牌型定义
const SpecialCardTypes = {
    SIX_PAIRS: { value: 10, name: '六对半' },
    THREE_FLUSHES: { value: 11, name: '三同花' },
    THREE_STRAIGHTS: { value: 12, name: '三顺子' },
    ALL_SMALL: { value: 13, name: '全小' },
    ALL_BIG: { value: 14, name: '全大' },
    DRAGON: { value: 15, name: '一条龙' },
};

function getHandDetails(hand) {
    if (!hand || hand.length === 0) return { type: CardTypes.HIGH_CARD, rank: 0, name: '乌龙' };
    const ranks = hand.map(c => c.rank).sort((a, b) => a - b);
    const suits = hand.map(c => c.suit.key);
    const isFlush = new Set(suits).size === 1;
    const uniqueRanks = [...new Set(ranks)];
    let isStraight = false;
    let straightRank = 0;
    if (uniqueRanks.length === hand.length && uniqueRanks.length >= 3) {
        if (uniqueRanks[uniqueRanks.length - 1] - uniqueRanks[0] === uniqueRanks.length - 1) {
            isStraight = true;
            straightRank = uniqueRanks[uniqueRanks.length - 1];
        }
        if (uniqueRanks.toString() === [0, 1, 2, 3, 12].toString() && uniqueRanks.length === 5) {
            isStraight = true;
            straightRank = 3;
        }
    }
    const rankCounts = new Map();
    ranks.forEach(r => rankCounts.set(r, (rankCounts.get(r) || 0) + 1));
    const counts = [...rankCounts.values()].sort((a, b) => b - a);
    const mainRank = (rank) => [...rankCounts.keys()].find(k => rankCounts.get(k) === rank);

    if (isStraight && isFlush) return { type: CardTypes.STRAIGHT_FLUSH, rank: straightRank, name: '同花顺', cards: hand };
    if (counts[0] === 4) return { type: CardTypes.FOUR_OF_A_KIND, rank: mainRank(4), name: '铁支', cards: hand };
    if (counts[0] === 3 && counts[1] === 2) return { type: CardTypes.FULL_HOUSE, rank: mainRank(3), name: '葫芦', cards: hand };
    if (isFlush) return { type: CardTypes.FLUSH, rank: ranks[ranks.length - 1], name: '同花', cards: hand };
    if (isStraight) return { type: CardTypes.STRAIGHT, rank: straightRank, name: '顺子', cards: hand };
    if (counts[0] === 3) return { type: CardTypes.THREE_OF_A_KIND, rank: mainRank(3), name: '三条', cards: hand };
    if (counts[0] === 2 && counts[1] === 2) return { type: CardTypes.TWO_PAIR, rank: Math.max(...[...rankCounts.keys()].filter(k => rankCounts.get(k) === 2)), name: '两对', cards: hand };
    if (counts[0] === 2) return { type: CardTypes.PAIR, rank: mainRank(2), name: '对子', cards: hand };
    return { type: CardTypes.HIGH_CARD, rank: ranks[ranks.length-1], name: '乌龙', cards: hand };
}

function compareHands(hand1, hand2) {
    const details1 = getHandDetails(hand1);
    const details2 = getHandDetails(hand2);
    if (details1.type.value > details2.type.value) return 1;
    if (details1.type.value < details2.type.value) return -1;
    if (details1.rank > details2.rank) return 1;
    if (details1.rank < details2.rank) return -1;
    const ranks1 = hand1.map(c => c.rank).sort((a, b) => b - a);
    const ranks2 = hand2.map(c => c.rank).sort((a, b) => b - a);
    for(let i=0; i < ranks1.length; i++){
        if(ranks1[i] > ranks2[i]) return 1;
        if(ranks1[i] < ranks2[i]) return -1;
    }
    return 0;
}

export class ThirteenWaterGame {
    constructor(playerNames = ['您', 'AI-2', 'AI-3', 'AI-4']) {
        this.players = playerNames.map((name, idx) => ({
            id: `player-${idx}`,
            name,
            hand: [],
            groups: [[], [], []],
            specialType: null,
        }));
        this.deck = [];
        this.gameState = 'pending';
    }

    startGame() {
        this.deck = shuffle(createDeck().filter(card => card.type !== 'joker'));
        this.players.forEach((p, i) => {
            p.hand = this.deck.slice(i * 13, (i + 1) * 13).sort((a, b) => a.rank - b.rank);
            p.specialType = this.checkSpecialType(p.hand);
        });
        this.gameState = 'grouping';
    }

    checkSpecialType(hand) {
        const ranks = hand.map(c => c.rank);
        const suits = hand.map(c => c.suit.key);
        const uniqueRanks = [...new Set(ranks)];
        const rankCounts = new Map();
        ranks.forEach(r => rankCounts.set(r, (rankCounts.get(r) || 0) + 1));
        if (uniqueRanks.length === 13) return SpecialCardTypes.DRAGON;
        if (hand.filter(c => c.rank > 7).length === 13) return SpecialCardTypes.ALL_BIG;
        if (hand.filter(c => c.rank < 8).length === 13) return SpecialCardTypes.ALL_SMALL;
        const front = getHandDetails(hand.slice(0,3));
        const middle = getHandDetails(hand.slice(3,8));
        const back = getHandDetails(hand.slice(8,13));
        if(front.type.value === CardTypes.FLUSH.value && middle.type.value === CardTypes.FLUSH.value && back.type.value === CardTypes.FLUSH.value) return SpecialCardTypes.THREE_FLUSHES;
        if(front.type.value === CardTypes.STRAIGHT.value && middle.type.value === CardTypes.STRAIGHT.value && back.type.value === CardTypes.STRAIGHT.value) return SpecialCardTypes.THREE_STRAIGHTS;
        if ([...rankCounts.values()].filter(c => c === 2).length === 6) return SpecialCardTypes.SIX_PAIRS;
        return null;
    }

    autoGroup(playerId) {
        const player = this.players.find(p => p.id === playerId);
        if (!player || player.specialType) {
            if (player.specialType) player.groups = [[], [], []];
            return;
        }
        const hand = [...player.hand];
        let bestBack = this.findBestHand(hand, 5);
        let remaining1 = hand.filter(c => !bestBack.find(bc => bc.id === c.id));
        let bestMiddle = this.findBestHand(remaining1, 5);
        let front = remaining1.filter(c => !bestMiddle.find(mc => mc.id === c.id));
        if (compareHands(bestBack, bestMiddle) >= 0 && compareHands(bestMiddle, front) >= 0) {
            player.groups = [front, bestMiddle, bestBack];
        } else {
            bestMiddle.push(front.pop());
            front.push(bestMiddle.shift());
            front.sort((a,b)=>a.rank - b.rank);
            bestMiddle.sort((a,b)=>a.rank-b.rank);
            player.groups = [front, bestMiddle, bestBack];
        }
    }

    findBestHand(hand, size) {
        let bestHand = hand.slice(0, size);
        let bestDetails = getHandDetails(bestHand);
        for(let i=0; i< (hand.length > 8 ? 500 : 100); i++) {
            const randomHand = shuffle(hand).slice(0, size);
            const randomDetails = getHandDetails(randomHand);
            if(compareHands(randomHand, bestHand) > 0) {
                bestHand = randomHand;
                bestDetails = randomDetails;
            }
        }
        return bestHand;
    }

    compareAll() {
        const scores = new Map(this.players.map(p => [p.id, 0]));
        for (let i = 0; i < this.players.length; i++) {
            for (let j = i + 1; j < this.players.length; j++) {
                const p1 = this.players[i];
                const p2 = this.players[j];
                let sessionScore = 0;
                const p1Special = p1.specialType?.value || 0;
                const p2Special = p2.specialType?.value || 0;
                if (p1Special || p2Special) {
                    if (p1Special > p2Special) sessionScore = (p1Special - 9) * 2;
                    else if (p2Special > p1Special) sessionScore = -( (p2Special - 9) * 2 );
                } else {
                    let p1RoundScore = 0;
                    for(let k=0; k<3; k++){
                        p1RoundScore += compareHands(p1.groups[k], p2.groups[k]);
                    }
                    const scoreByHand = (handDetails) => {
                        if (handDetails.type === CardTypes.THREE_OF_A_KIND) return 2;
                        if (handDetails.type === CardTypes.FULL_HOUSE) return 1;
                        if (handDetails.type === CardTypes.FOUR_OF_A_KIND) return handDetails.cards.length === 5 ? 7 : 4;
                        if (handDetails.type === CardTypes.STRAIGHT_FLUSH) return handDetails.cards.length === 5 ? 10: 5;
                        return 0;
                    }
                    p1RoundScore += scoreByHand(getHandDetails(p1.groups[2]));
                    p1RoundScore -= scoreByHand(getHandDetails(p2.groups[2]));
                    p1RoundScore += scoreByHand(getHandDetails(p1.groups[1]));
                    p1RoundScore -= scoreByHand(getHandDetails(p2.groups[1]));
                    p1RoundScore += scoreByHand(getHandDetails(p1.groups[0]));
                    if(Math.abs(p1RoundScore.toString().split('').filter(s=>s!=='-').join('')) === 3) {
                       p1RoundScore *= 2;
                    }
                    sessionScore = p1RoundScore;
                }
                scores.set(p1.id, scores.get(p1.id) + sessionScore);
                scores.set(p2.id, scores.get(p2.id) - sessionScore);
            }
        }
        this.gameState = 'ended';
        return this.players.map(p => ({
            id: p.id,
            name: p.name,
            score: scores.get(p.id),
            groups: p.groups.map(g => ({ ...getHandDetails(g), cards: g })),
            specialType: p.specialType,
        }));
    }
}