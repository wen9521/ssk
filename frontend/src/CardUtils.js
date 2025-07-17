export const sortCards = (cards) => {
    const cardOrder = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2', 'black_joker', 'red_joker'];

    const getCardValue = (card) => {
        const [rank] = card.split('_');
        let value = cardOrder.indexOf(rank);
        if (rank === 'black_joker') value = cardOrder.indexOf('black_joker');
        if (rank === 'red_joker') value = cardOrder.indexOf('red_joker');
        return value;
    };

    return [...cards].sort((a, b) => {
        const valA = getCardValue(a);
        const valB = getCardValue(b);

        if (valA === valB) {
            // If values are the same, sort by suit (optional, usually not needed for Doudizhu)
            const suitA = a.split('_')[1];
            const suitB = b.split('_')[1];
            const suitOrder = ['diamonds', 'clubs', 'hearts', 'spades']; // Move suitOrder inside if needed
            return suitOrder.indexOf(suitA) - suitOrder.indexOf(suitB);
        }
        return valA - valB;
    });
};

const cardRanks = {
    '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'jack': 11, 'queen': 12, 'king': 13, 'ace': 14, '2': 16, // 2 is higher than A
    'black_joker': 17, 'red_joker': 18
};

const getCardRank = (card) => {
    if (card === 'black_joker') return cardRanks['black_joker'];
    if (card === 'red_joker') return cardRanks['red_joker'];
    const rankStr = card.split('_')[0];
    return cardRanks[rankStr];
};

// Helper to check if a set of ranks forms a straight
const isStraight = (ranks) => {
    if (ranks.length < 5) return false;
    // Straights cannot contain 2s or jokers
    if (ranks.includes(cardRanks['2']) || ranks.includes(cardRanks['black_joker']) || ranks.includes(cardRanks['red_joker'])) {
        return false;
    }
    for (let i = 0; i < ranks.length - 1; i++) {
        if (ranks[i] + 1 !== ranks[i + 1]) {
            return false;
        }
    }
    return true;
};

// Helper to check if a set of ranks forms a sequence of pairs
const isSequenceOfPairs = (ranks) => {
    if (ranks.length < 6 || ranks.length % 2 !== 0) return false; // Must be even number and at least 3 pairs

    // Sequence of pairs cannot contain 2s or jokers
    if (ranks.includes(cardRanks['2']) || ranks.includes(cardRanks['black_joker']) || ranks.includes(cardRanks['red_joker'])) {
        return false;
    }

    const rankCounts = {};
    ranks.forEach(rank => {
        rankCounts[rank] = (rankCounts[rank] || 0) + 1;
    });

    const uniqueRanks = Object.keys(rankCounts).map(Number).sort((a, b) => a - b);

    if (uniqueRanks.length !== ranks.length / 2) return false; // Ensure all are pairs

    for (const rank of uniqueRanks) {
        if (rankCounts[rank] !== 2) return false; // Each unique rank must appear exactly twice
    }

    // Check for consecutive unique ranks
    for (let i = 0; i < uniqueRanks.length - 1; i++) {
        if (uniqueRanks[i] + 1 !== uniqueRanks[i + 1]) {
            return false;
        }
    }
    return true;
};

// Helper to find consecutive triples (for airplanes)
const findConsecutiveTriples = (ranks) => {
    const rankCounts = {};
    ranks.forEach(rank => {
        rankCounts[rank] = (rankCounts[rank] || 0) + 1;
    });

    const triples = Object.keys(rankCounts)
                        .filter(rank => rankCounts[rank] >= 3)
                        .map(Number)
                        .sort((a, b) => a - b);
    
    if (triples.length < 2) return null; // Need at least two triples for an airplane

    // Check for consecutive triples and exclude 2s and jokers
    for (let i = 0; i < triples.length - 1; i++) {
        if (triples[i] + 1 !== triples[i + 1] || triples[i] === cardRanks['2']) {
            return null;
        }
    }
    return triples; // Return the ranks of the main triples
};

export const getHandType = (cards) => {
    if (cards.length === 0) return { type: 'invalid' };

    const sortedRanks = cards.map(getCardRank).sort((a, b) => a - b);
    const uniqueRanks = [...new Set(sortedRanks)];
    const rankCounts = {};
    sortedRanks.forEach(rank => {
        rankCounts[rank] = (rankCounts[rank] || 0) + 1;
    });

    // Single card
    if (cards.length === 1) {
        return { type: 'single', rank: sortedRanks[0], count: 1 };
    }

    // Pair
    if (cards.length === 2 && uniqueRanks.length === 1) {
        return { type: 'pair', rank: sortedRanks[0], count: 2 };
    }

    // Triple
    if (cards.length === 3 && uniqueRanks.length === 1) {
        return { type: 'triple', rank: sortedRanks[0], count: 3 };
    }
    
    // Bomb (Four of a kind)
    if (cards.length === 4 && uniqueRanks.length === 1) {
        return { type: 'bomb', rank: sortedRanks[0], count: 4 };
    }

    // Rocket (Jokers)
    if (cards.length === 2 && sortedRanks[0] === cardRanks['black_joker'] && sortedRanks[1] === cardRanks['red_joker']) {
        return { type: 'rocket', rank: cardRanks['red_joker'], count: 2 };
    }

    // Straight
    if (isStraight(sortedRanks)) {
        return { type: 'straight', rank: sortedRanks[sortedRanks.length - 1], count: cards.length };
    }

    // Sequence of Pairs
    if (isSequenceOfPairs(sortedRanks)) {
        return { type: 'sequence_of_pairs', rank: sortedRanks[0], count: cards.length }; // Rank is the smallest card in sequence
    }

    // Three with one / Three with pair
    const triples = uniqueRanks.filter(rank => rankCounts[rank] === 3);
    if (triples.length === 1) {
        const tripleRank = triples[0];
        // const remainingCards = cards.filter(card => getCardRank(card) !== tripleRank); // This variable was unused

        if (cards.length === 4) { // Assuming 'three with one' has 4 cards total
            const nonTripleCards = cards.filter(card => getCardRank(card) !== tripleRank);
            if (nonTripleCards.length === 1) {
                return { type: 'triple_with_single', rank: tripleRank, count: 4 };
            }
        }
        if (cards.length === 5) { // Assuming 'three with pair' has 5 cards total
            const nonTripleCards = cards.filter(card => getCardRank(card) !== tripleRank);
            const remainingRanks = nonTripleCards.map(getCardRank);
            if (remainingRanks.length === 2 && remainingRanks[0] === remainingRanks[1]) {
                return { type: 'triple_with_pair', rank: tripleRank, count: 5 };
            }
        }
    }

    // Airplane (with or without wings)
    const mainTriples = findConsecutiveTriples(sortedRanks);
    if (mainTriples) {
        const numTriples = mainTriples.length;
        const cardsInTriples = numTriples * 3;
        
        // Calculate actual remaining cards carefully, considering cases where a 4-of-a-kind was part of a triple set
        const tempCards = [...cards];
        for (const tripleRank of mainTriples) {
            let count = 0;
            for (let i = 0; i < tempCards.length; i++) {
                if (getCardRank(tempCards[i]) === tripleRank && count < 3) {
                    tempCards.splice(i, 1);
                    count++;
                    i--; 
                }
            }
        }

        const actualRemainingCards = tempCards;

        // Airplane with single wings
        if (cards.length === cardsInTriples + numTriples && actualRemainingCards.length === numTriples) {
            const wingRanks = actualRemainingCards.map(getCardRank);
            const wingRankCounts = {};
            wingRanks.forEach(rank => {wingRankCounts[rank] = (wingRankCounts[rank] || 0) + 1;});
            let isValidWings = true;
            for (const rank of [...new Set(wingRanks)]) {
                if (wingRankCounts[rank] !== 1) {isValidWings = false; break;}
            }
            if (isValidWings) {
                return { type: 'airplane_with_singles', rank: mainTriples[mainTriples.length - 1], count: cards.length, numTriples: numTriples };
            }
        }

        // Airplane with pair wings
        if (cards.length === cardsInTriples + (numTriples * 2) && actualRemainingCards.length === numTriples * 2) {
            const wingRanks = actualRemainingCards.map(getCardRank);
            const wingRankCounts = {};
            wingRanks.forEach(rank => {wingRankCounts[rank] = (wingRankCounts[rank] || 0) + 1;});
            let isValidWings = true;
            for (const rank of [...new Set(wingRanks)]) {
                if (wingRankCounts[rank] !== 2) {isValidWings = false; break;}
            }
            if (isValidWings) {
                return { type: 'airplane_with_pairs', rank: mainTriples[mainTriples.length - 1], count: cards.length, numTriples: numTriples };
            }
        }
        
        // If it's just triples without proper wings that we recognized
        if (cards.length === cardsInTriples) {
             return { type: 'airplane_no_wings', rank: mainTriples[mainTriples.length - 1], count: cards.length };
        }
    }

    // Four with two singles or two pairs
    const fourOfAKind = uniqueRanks.filter(rank => rankCounts[rank] === 4);
    if (fourOfAKind.length === 1) {
        const fourRank = fourOfAKind[0];
        const remainingCardsFromOriginal = cards.filter(card => getCardRank(card) !== fourRank);
        const remainingRanks = remainingCardsFromOriginal.map(getCardRank);
        const remainingRankCounts = {};
        remainingRanks.forEach(rank => {remainingRankCounts[rank] = (remainingRankCounts[rank] || 0) + 1;});
        const remainingUniqueRanks = [...new Set(remainingRanks)];

        // Four with two singles
        if (remainingCardsFromOriginal.length === 2 && remainingUniqueRanks.length === 2) {
            return { type: 'four_with_two_singles', rank: fourRank, count: 6 };
        }
        // Four with two pairs
        if (remainingCardsFromOriginal.length === 4 && remainingUniqueRanks.length === 2) {
            if (remainingRankCounts[remainingUniqueRanks[0]] === 2 && remainingRankCounts[remainingUniqueRanks[1]] === 2) {
                return { type: 'four_with_two_pairs', rank: fourRank, count: 8 };
            }
        }
    }

    return { type: 'invalid' };
};

export const compareHands = (newHand, prevHand) => {
    const newHandType = getHandType(newHand);
    const prevHandType = getHandType(prevHand);

    if (newHandType.type === 'invalid') {
        return false; // Cannot play invalid hand
    }

    // Rocket is biggest
    if (newHandType.type === 'rocket') return true;
    if (prevHandType.type === 'rocket') return false;

    // Bomb can beat anything except rocket, or a smaller bomb
    if (newHandType.type === 'bomb') {
        if (prevHandType.type !== 'bomb' && prevHandType.type !== 'rocket') return true; // Bomb beats non-bomb/non-rocket
        if (prevHandType.type === 'bomb') return newHandType.rank > prevHandType.rank; // Bomb beats smaller bomb
        return false; // Cannot beat rocket
    }
    if (prevHandType.type === 'bomb') return false; // If prevHand is bomb, newHand must be bomb or rocket

    // For other types, must match type, length, and be larger
    if (newHandType.type === prevHandType.type && newHand.length === prevHand.length) {
        // For airplanes, we need to compare based on the number of triples as well
        if (newHandType.type.startsWith('airplane') && newHandType.numTriples !== prevHandType.numTriples) {
            return false; // Airplanes must have the same number of triples to compare
        }
        return newHandType.rank > prevHandType.rank;
    }
    
    // Special case: bomb or rocket can beat any other type (already handled above)
    // This part should only be reached if newHandType is NOT bomb/rocket, AND prevHandType is NOT bomb/rocket.

    return false; // Cannot beat previous hand
};
