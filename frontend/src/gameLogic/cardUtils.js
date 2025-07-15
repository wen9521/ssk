// frontend/src/gameLogic/cardUtils.js

const SUITS = ['H', 'S', 'D', 'C']; // Hearts, Spades, Diamonds, Clubs
const VALUES = ['3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A', '2'];
const JOKERS = ['BJ', 'RJ']; // Black Joker, Red Joker

// 为大二和斗地主定义牌的权重
const BIG_TWO_CARD_ORDER = '3456789TJQKA2';
const DOUDIZHU_CARD_ORDER = '3456789TJQKA2'; // 斗地主大小王特殊处理

const getRankValue = (card, gameType = 'doudizhu') => {
    if (card === 'BJ') return gameType === 'big_two' ? 53 : 16;
    if (card === 'RJ') return gameType === 'big_two' ? 54 : 17;
    
    const value = card.substring(1);
    const order = gameType === 'big_two' ? BIG_TWO_CARD_ORDER : DOUDIZHU_CARD_ORDER;
    return order.indexOf(value);
};

const getSuitValue = (card) => {
    if (JOKERS.includes(card)) return 5; // Jokers are highest
    const suit = card.substring(0, 1);
    return ['C', 'D', 'S', 'H'].indexOf(suit); // 假设花色大小: C < D < S < H (梅花 < 方块 < 黑桃 < 红桃)
}

export const createDeck = () => {
    const deck = [];
    SUITS.forEach(suit => {
        VALUES.forEach(value => {
            deck.push(`${suit}${value}`);
        });
    });
    deck.push(...JOKERS);
    return deck;
};

export const shuffleDeck = (deck) => {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
};

export const dealDoudizhu = (deck) => {
    const hands = [[], [], []];
    for (let i = 0; i < 51; i++) {
        hands[i % 3].push(deck[i]);
    }
    const landlordCards = deck.slice(51);
    return { hands, landlordCards };
};

export const dealBigTwo = (deck) => {
    const hands = [[], [], [], []];
    const noJokersDeck = deck.filter(c => !JOKERS.includes(c));
    for (let i = 0; i < 52; i++) {
        hands[i % 4].push(noJokersDeck[i]);
    }
     return { hands };
};

export const dealThirteenWater = (deck) => {
    const hands = [[], [], [], []];
    const noJokersDeck = deck.filter(c => !JOKERS.includes(c));
    for (let i = 0; i < 52; i++) {
        hands[i % 4].push(noJokersDeck[i]);
    }
     return { hands };
}


// Sort functions
export const sortCards = (cards, gameType = 'doudizhu') => {
    return cards.sort((a, b) => {
        const rankA = getRankValue(a, gameType);
        const rankB = getRankValue(b, gameType);
        if (rankA !== rankB) {
            return rankB - rankA;
        }
        // Big Two requires suit comparison if ranks are equal
        if (gameType === 'big_two') {
             return getSuitValue(b) - getSuitValue(a);
        }
        return getSuitValue(b) - getSuitValue(a);
    });
};
