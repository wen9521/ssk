// frontend/src/utils/game/format.js

// --- Frontend Format (e.g., 'TS' for 10 of Spades) to Legacy AI Format (e.g., '10_of_spades') ---
export const cardToLegacyFormat = (card) => {
    if (!card || typeof card !== 'string' || card.length < 2) return '2_of_clubs';

    const rankChar = card.slice(0, -1).toUpperCase();
    const suitChar = card.slice(-1).toUpperCase();
    
    // Consistent rank mapping: 'T' is the standard for 10
    const rankMap = { 'A': 'ace', 'K': 'king', 'Q': 'queen', 'J': 'jack', 'T': '10', '9': '9', '8': '8', '7': '7', '6': '6', '5': '5', '4': '4', '3': '3', '2': '2' };
    const suitMap = { 'S': 'spades', 'H': 'hearts', 'D': 'diamonds', 'C': 'clubs'};

    const rank = rankMap[rankChar];
    const suit = suitMap[suitChar];

    if (!rank || !suit) return '2_of_clubs'; // Default card on error
    return `${rank}_of_${suit}`;
};


// --- Legacy AI Format (e.g., '10_of_spades') to Frontend Format (e.g., 'TS') ---
export const dunFromLegacyFormat = (dun) => {
    if (!dun) return { dun1: [], dun2: [], dun3: [] };

    // Inverse mapping, ensuring '10' from AI maps to 'T'
    const rankMap = { 'ace': 'A', 'king': 'K', 'queen': 'Q', 'jack': 'J', '10': 'T', '9': '9', '8': '8', '7': '7', '6': '6', '5': '5', '4': '4', '3': '3', '2': '2' };
    const suitMap = { 'spades': 'S', 'hearts': 'H', 'diamonds': 'D', 'clubs': 'C' };

    const convertCard = (card) => {
        if (typeof card !== 'string') return '2C';
        const parts = card.split('_of_');
        if (parts.length < 2) return '2C'; // Return default if format is wrong
        
        const rank = rankMap[parts[0]];
        const suit = suitMap[parts[1]];
        
        // If either part fails to map, return a default card
        return rank && suit ? rank + suit : '2C';
    };

    // Ensure duns exist before mapping
    const head = dun.head || [];
    const middle = dun.middle || [];
    const tail = dun.tail || [];

    return {
        dun1: head.map(convertCard),
        dun2: middle.map(convertCard),
        dun3: tail.map(convertCard),
    };
};
