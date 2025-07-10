// frontend/src/utils/game/format.js

export const cardToLegacyFormat = (card) => {
    if (!card || typeof card !== 'string' || card.length < 2) return '2_of_clubs';

    const rankStr = card.slice(0, -1).toUpperCase();
    const suitChar = card.slice(-1).toUpperCase();
    
    const rankMap = { 'A': 'ace', 'K': 'king', 'Q': 'queen', 'J': 'jack', 'T': '10', '10': '10', '9': '9', '8': '8', '7': '7', '6': '6', '5': '5', '4': '4', '3': '3', '2': '2' };
    const suitMap = { '♠': 'spades', '♥': 'hearts', '♦': 'diamonds', '♣': 'clubs', 'S': 'spades', 'H': 'hearts', 'D': 'diamonds', 'C': 'clubs'};

    const rank = rankMap[rankStr];
    const suit = suitMap[suitChar];

    if (!rank || !suit) return '2_of_clubs'; // Default card
    return `${rank}_of_${suit}`;
};

export const dunFromLegacyFormat = (dun) => {
    if (!dun) return { dun1: [], dun2: [], dun3: [] };

    const rankMap = { 'ace': 'A', 'king': 'K', 'queen': 'Q', 'jack': 'J', '10': 'T', '9': '9', '8': '8', '7': '7', '6': '6', '5': '5', '4': '4', '3': '3', '2': '2' };
    const suitMap = { 'spades': 'S', 'hearts': 'H', 'diamonds': 'D', 'clubs': 'C' };

    const convertCard = (card) => {
        if (typeof card !== 'string') return '2C';
        const parts = card.split('_of_');
        if (parts.length < 2) return '2C';
        
        const rank = rankMap[parts[0]];
        const suit = suitMap[parts[1]];
        return rank && suit ? rank + suit : '2C';
    };

    return {
        dun1: (dun.head || []).map(convertCard),
        dun2: (dun.middle || []).map(convertCard),
        dun3: (dun.tail || []).map(convertCard),
    };
};
