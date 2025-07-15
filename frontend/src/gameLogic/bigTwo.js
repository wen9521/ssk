// frontend/src/gameLogic/bigTwo.js
import { sortCards } from './cardUtils';

const getCardValue = (card) => {
    const value = card.substring(1);
    const suit = card.substring(0, 1);
    const order = '3456789TJQKA2';
    const suitOrder = 'DCSH'; // Diamonds, Clubs, Spades, Hearts
    return order.indexOf(value) * 4 + suitOrder.indexOf(suit);
};

// Determines the type of a Big Two hand
export const getHandType = (cards) => {
    const numCards = cards.length;
    if (numCards === 0) return { type: 'Invalid' };
    
    const sortedCards = sortCards(cards, 'big_two');
    const cardValues = sortedCards.map(getCardValue);
    
    // Singles and Pairs
    if (numCards === 1) return { type: 'Single', value: cardValues[0] };
    if (numCards === 2) {
        if (sortedCards[0][1] === sortedCards[1][1]) {
             return { type: 'Pair', value: Math.max(...cardValues) };
        }
    }

    // 5-card hands
    if (numCards === 5) {
        const suits = new Set(sortedCards.map(c => c[0]));
        const isFlush = suits.size === 1;
        
        const ranks = '3456789TJQKA2';
        const cardRanks = sortedCards.map(c => ranks.indexOf(c[1])).sort((a,b)=>a-b);
        
        let isStraight = true;
        for(let i=0; i < cardRanks.length - 1; i++) {
            if (cardRanks[i+1] - cardRanks[i] !== 1) {
                // Handle special A,2,3,4,5 straight
                 if (JSON.stringify(cardRanks) === '[0,1,2,3,12]') { // 3,4,5,6,A
                     // This is a straight, but its value is determined by the 6
                 } else {
                    isStraight = false;
                 }
            }
        }

        const counts = cardRanks.reduce((acc, rank) => {
            acc[rank] = (acc[rank] || 0) + 1;
            return acc;
        }, {});
        const countsValues = Object.values(counts);
        const isFourOfAKind = countsValues.includes(4);
        const isFullHouse = countsValues.includes(3) && countsValues.includes(2);

        if (isStraight && isFlush) return { type: 'StraightFlush', value: Math.max(...cardValues), rank: 4 };
        if (isFourOfAKind) return { type: 'FourOfAKind', value: Math.max(...cardValues), rank: 3 };
        if (isFullHouse) return { type: 'FullHouse', value: Math.max(...cardValues), rank: 2 };
        if (isFlush) return { type: 'Flush', value: Math.max(...cardValues), rank: 1 };
        if (isStraight) return { type: 'Straight', value: Math.max(...cardValues), rank: 0 };
    }

    return { type: 'Invalid' };
};

export const canPlay = (myHand, lastHand) => {
    const myHandType = getHandType(myHand);
    const lastHandType = getHandType(lastHand);
    
    if (myHandType.type === 'Invalid') return false;

    // Any valid hand can be played on an empty board
    if (!lastHand || lastHand.length === 0) return true;
    
    // Must play the same number of cards
    if (myHand.length !== lastHand.length) return false;
    
    // 5-card hands have ranks
    if (myHand.length === 5 && lastHand.length === 5) {
        if (myHandType.rank > lastHandType.rank) return true;
        if (myHandType.rank === lastHandType.rank) {
            return myHandType.value > lastHandType.value;
        }
        return false;
    }

    // Singles and pairs
    if (myHandType.type === lastHandType.type) {
        return myHandType.value > lastHandType.value;
    }

    return false;
};

// Simple AI to find a playable hand
export const findPlayableHand = (hand, lastPlayedHand) => {
    // This is a very basic AI. It just finds the smallest valid hand to play.
    
    // Try to play single card
    for (let card of sortCards(hand, 'big_two')) {
        if (canPlay([card], lastPlayedHand)) {
            return [card];
        }
    }

    // Try to play pairs
    // ... more logic would be needed here to find pairs, straights, etc.

    return null; // No playable hand found
}
