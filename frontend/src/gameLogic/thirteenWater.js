// frontend/src/gameLogic/thirteenWater.js
import { sortCards } from './cardUtils';

// Helper to get card values for comparison
const getCardValue = (card) => {
    const value = card.substring(1);
    const order = '23456789TJQKA';
    return order.indexOf(value);
}

const getSuit = (card) => card.substring(0,1);

// This function will evaluate a 3, 5, or 5 card hand and return its type and rank.
// This is a simplified version. A real version would be much more complex.
const evaluateHand = (hand) => {
    if (!hand || hand.length === 0) {
        return { type: 'Invalid', rank: -1 };
    }
    const sortedHand = sortCards(hand, 'thirteen_water');
    const values = sortedHand.map(getCardValue);
    const suits = sortedHand.map(getSuit);
    
    const isFlush = new Set(suits).size === 1;
    
    const isStraight = (vals) => {
        // Ace-low straight
        if (vals.toString() === '12,11,10,9,0') return true;
        for (let i = 0; i < vals.length - 1; i++) {
            if (vals[i+1] - vals[i] !== 1) return false;
        }
        return true;
    };

    const valueCounts = values.reduce((acc, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
    }, {});
    
    const counts = Object.values(valueCounts);
    const fourOfAKind = counts.includes(4);
    const threeOfAKind = counts.includes(3);
    const pairs = counts.filter(c => c === 2).length;

    if (isStraight(values) && isFlush) return { type: 'StraightFlush', rank: 8, highCard: Math.max(...values) };
    if (fourOfAKind) return { type: 'FourOfAKind', rank: 7, highCard: values.find(v => valueCounts[v] === 4) };
    if (threeOfAKind && pairs === 1) return { type: 'FullHouse', rank: 6, highCard: values.find(v => valueCounts[v] === 3) };
    if (isFlush) return { type: 'Flush', rank: 5, highCard: Math.max(...values) };
    if (isStraight(values)) return { type: 'Straight', rank: 4, highCard: Math.max(...values) };
    if (threeOfAKind) return { type: 'ThreeOfAKind', rank: 3, highCard: values.find(v => valueCounts[v] === 3) };
    if (pairs === 2) return { type: 'TwoPair', rank: 2, highCards: values.filter(v => valueCounts[v] === 2).sort((a,b) => b - a) };
    if (pairs === 1) return { type: 'Pair', rank: 1, highCard: values.find(v => valueCounts[v] === 2) };
    
    return { type: 'HighCard', rank: 0, highCards: values.sort((a,b) => b-a) };
}

// Function to validate the arrangement of the three hands
export const validateArrangement = (front, middle, back) => {
    if (!front || !middle || !back || front.length !== 3 || middle.length !== 5 || back.length !== 5) {
        return false;
    }

    const frontEval = evaluateHand(front);
    const middleEval = evaluateHand(middle);
    const backEval = evaluateHand(back);

    // Compare ranks
    if (frontEval.rank > middleEval.rank || middleEval.rank > backEval.rank) {
        return false;
    }

    // If ranks are equal, compare high cards
    if (frontEval.rank === middleEval.rank) {
        // Simplified comparison
        if (frontEval.highCard > middleEval.highCard) return false;
    }
    if (middleEval.rank === backEval.rank) {
        if (middleEval.highCard > backEval.highCard) return false;
    }

    return true;
};

// A more robust AI to arrange cards
export const autoArrangeCards = (hand) => {
    if (!hand || hand.length !== 13) {
        // Return a default valid (but weak) split if hand is invalid
        return {
            front: [],
            middle: [],
            back: [],
        };
    }

    // This is a placeholder for a complex algorithm.
    // For now, it just splits the cards.
    const sortedHand = sortCards(hand, 'thirteen_water');
    
    // A real AI would try many combinations to find the best one.
    // This simple split is unlikely to be valid most of the time.
    
    // Let's try to make it a bit smarter to avoid invalid hands.
    // This is still a very naive implementation.
    
    let bestArrangement = {
        front: sortedHand.slice(10, 13),
        middle: sortedHand.slice(5, 10),
        back: sortedHand.slice(0, 5)
    };
    
    // A very basic loop to try and find a valid arrangement.
    // This is not efficient and may not find the best arrangement.
    for (let i = 0; i < 100; i++) { // Limit iterations to prevent freezing
        let tempHand = [...sortedHand].sort(() => Math.random() - 0.5);
        let arrangement = {
            back: tempHand.slice(0, 5),
            middle: tempHand.slice(5, 10),
            front: tempHand.slice(10, 13)
        };
        if (validateArrangement(arrangement.front, arrangement.middle, arrangement.back)) {
            // A simple scoring could be added here to find the *best* valid arrangement
            bestArrangement = arrangement;
            break; // Found a valid one, break for now.
        }
    }
    
    return bestArrangement;
}
