const cardOrder = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2', 'BJ', 'RJ'];
const suitOrder = ['D', 'C', 'H', 'S'];

function getCardValue(card) {
    const parts = card.split('_of_');
    let rank = parts[0];
    if (rank === 'black' || rank === 'red') {
        rank = rank === 'black' ? 'BJ' : 'RJ';
    } else {
        rank = rank.toUpperCase().replace('ACE', 'A').replace('JACK', 'J').replace('QUEEN', 'Q').replace('KING', 'K');
    }
    return {
        rank,
        suit: parts.length > 1 ? parts[1].charAt(0).toUpperCase() : ''
    };
}

export function sortCards(cards) {
    return cards.sort((a, b) => {
        const aVal = getCardValue(a);
        const bVal = getCardValue(b);
        const aRankIndex = cardOrder.indexOf(aVal.rank);
        const bRankIndex = cardOrder.indexOf(bVal.rank);

        if (aRankIndex !== bRankIndex) {
            return aRankIndex - bRankIndex;
        }
        return suitOrder.indexOf(aVal.suit) - suitOrder.indexOf(bVal.suit);
    });
}
