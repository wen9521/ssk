// frontend/src/gameLogic/doudizhu.js
import { sortCards } from './cardUtils';

// Helper to get card values for comparison
const getCardValue = (card) => {
    if (card === 'BJ') return 16;
    if (card === 'RJ') return 17;
    const value = card.substring(1);
    const order = '3456789TJQKA2';
    return order.indexOf(value) + 3;
}

const getCardCounts = (cards) => {
    const counts = {};
    cards.forEach(card => {
        const value = getCardValue(card);
        counts[value] = (counts[value] || 0) + 1;
    });
    return counts;
};


export const isValidDoudizhuHand = (cards) => {
    if (!cards || cards.length === 0) {
        return false;
    }
    return getHandType(cards) !== 'Invalid';
}

// Determines the type of a Doudizhu hand
export const getHandType = (cards) => {
    const sortedCards = sortCards(cards, 'doudizhu');
    const counts = getCardCounts(sortedCards);
    const cardValues = Object.keys(counts).map(Number).sort((a, b) => a - b);
    const numCards = sortedCards.length;

    switch (numCards) {
        case 1:
            return { type: 'Single', value: getCardValue(sortedCards[0]) };
        case 2:
            if (getCardValue(sortedCards[0]) === getCardValue(sortedCards[1])) {
                return { type: 'Pair', value: getCardValue(sortedCards[0]) };
            }
            if (sortedCards.includes('BJ') && sortedCards.includes('RJ')) {
                return { type: 'Rocket' }; // Highest hand
            }
            break;
        case 3:
            if (Object.values(counts)[0] === 3) {
                 return { type: 'Trio', value: getCardValue(sortedCards[0]) };
            }
            break;
        case 4:
            if (Object.values(counts).includes(3) && Object.values(counts).includes(1)) {
                 const trioValue = cardValues.find(v => counts[v] === 3);
                 return { type: 'Trio_plus_Single', value: trioValue };
            }
            if (Object.values(counts)[0] === 4) {
                 return { type: 'Bomb', value: getCardValue(sortedCards[0]) };
            }
            break;
        case 5:
             if (Object.values(counts).includes(3) && Object.values(counts).includes(2)) {
                 const trioValue = cardValues.find(v => counts[v] === 3);
                 return { type: 'Full_House', value: trioValue };
             }
             if (isStraight(cardValues)) {
                 return { type: 'Straight', value: Math.max(...cardValues) };
             }
             break;
    }
    
     // More complex hands
    if (isStraight(cardValues) && numCards >= 5) {
        return { type: 'Straight', value: Math.max(...cardValues) };
    }
    
    if (isSequenceOfPairs(cardValues, counts) && numCards >= 6) {
        const maxVal = Math.max(...cardValues)
        return { type: 'Sequence_of_Pairs', value: maxVal, length: numCards / 2 };
    }
    
    if (isSequenceOfTrios(cardValues, counts, numCards)) {
        const trioValues = cardValues.filter(v => counts[v] === 3);
        const maxVal = Math.max(...trioValues)
        return { type: 'Sequence_of_Trios', value: maxVal, length: numCards / 3 };
    }
    
     if (isSequenceOfTriosWithAttachments(cardValues, counts, numCards)) {
        const trioValues = cardValues.filter(v => counts[v] >= 3);
        const maxVal = Math.max(...trioValues);
        const length = trioValues.length;
        if(numCards === length * 4) return { type: 'Sequence_of_Trios_plus_Singles', value: maxVal, length };
        if(numCards === length * 5) return { type: 'Sequence_of_Trios_plus_Pairs', value: maxVal, length };
    }


    return { type: 'Invalid' };
};


// Check for a straight
const isStraight = (cardValues) => {
    if (cardValues.length < 5 || cardValues.includes(15)) return false; // 2 cannot be in a straight
    for (let i = 0; i < cardValues.length - 1; i++) {
        if (cardValues[i+1] - cardValues[i] !== 1) return false;
    }
    return true;
}

// Check for a sequence of pairs
const isSequenceOfPairs = (cardValues, counts) => {
    if (cardValues.length < 3) return false;
    for (const value of cardValues) {
        if (counts[value] !== 2 || value >= 15) return false; // All must be pairs, no 2s
    }
    for (let i = 0; i < cardValues.length - 1; i++) {
        if (cardValues[i+1] - cardValues[i] !== 1) return false;
    }
    return true;
}

// Check for a sequence of trios
const isSequenceOfTrios = (cardValues, counts, numCards) => {
    if (numCards < 6 || numCards % 3 !== 0) return false;
    const trioValues = cardValues.filter(v => counts[v] === 3);
    if (trioValues.length !== numCards / 3) return false;

    for (const value of trioValues) {
        if (value >= 15) return false; // No 2s in sequence
    }
     for (let i = 0; i < trioValues.length - 1; i++) {
        if (trioValues[i+1] - trioValues[i] !== 1) return false;
    }
    return true;
}

const isSequenceOfTriosWithAttachments = (cardValues, counts, numCards) => {
    const trioValues = cardValues.filter(v => counts[v] >= 3);
    if(trioValues.length < 2) return false;

    // Check if trios are sequential
    for (let i = 0; i < trioValues.length - 1; i++) {
        if (trioValues[i+1] - trioValues[i] !== 1) return false;
    }
    
    const numTrios = trioValues.length;
    
    // Trio + single
    if (numCards === numTrios * 4) {
        const singles = cardValues.filter(v => counts[v] === 1 || counts[v] === 3);
        return singles.length === numTrios * 2; // Should be enough cards for attachments
    }

    // Trio + pair
    if (numCards === numTrios * 5) {
        const pairs = cardValues.filter(v => counts[v] === 2 || counts[v] === 4);
         return pairs.length === numTrios;
    }

    return false;
}


export const canPlay = (myHand, lastHand) => {
  if (!lastHand || lastHand.length === 0) {
    return myHand.type !== 'Invalid';
  }
  
  // Rocket beats everything
  if (myHand.type === 'Rocket') return true;

  // Bomb logic
  if (myHand.type === 'Bomb') {
    if (lastHand.type === 'Rocket') return false;
    if (lastHand.type === 'Bomb') {
      return myHand.value > lastHand.value;
    }
    return true; // Bomb beats any other non-bomb, non-rocket hand
  }

  // Must be same type and length
  if (myHand.type !== lastHand.type || (myHand.length && myHand.length !== lastHand.length)) {
    return false;
  }
  
  // Compare values
  return myHand.value > lastHand.value;
};
