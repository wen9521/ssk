// frontend/src/components/Card.js
import React from 'react';
import './styles/Card.css';

const suitMap = {
    's': 'spades',
    'h': 'hearts',
    'd': 'diamonds',
    'c': 'clubs',
};

const rankMap = {
    'A': 'ace',
    'K': 'king',
    'Q': 'queen',
    'J': 'jack',
    'T': '10',
    '9': '9',
    '8': '8',
    '7': '7',
    '6': '6',
    '5': '5',
    '4': '4',
    '3': '3',
    '2': '2',
};

const getCardSvgName = (cardName) => {
    if (cardName === 'bj') {
        return 'black_joker';
    }
    if (cardName === 'rj') {
        return 'red_joker';
    }

    const suitChar = cardName.charAt(0);
    const rankChar = cardName.substring(1);

    const suit = suitMap[suitChar];
    const rank = rankMap[rankChar];

    if (!suit || !rank) {
        console.warn(`Invalid card name: ${cardName}`);
        return 'red_joker'; // Fallback to a default image
    }

    return `${rank}_of_${suit}`;
};

const Card = ({ cardName }) => {
    const finalCardName = getCardSvgName(cardName);
    const imageUrl = `${process.env.PUBLIC_URL}/cards/${finalCardName}.svg`;

    return (
        <div className="card">
            <img src={imageUrl} alt={cardName} className="card-image" />
        </div>
    );
};

export default Card;
