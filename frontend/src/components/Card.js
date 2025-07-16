// frontend/src/components/Card.js
import React from 'react';
import './styles/Card.css';

const getFinalCardName = (cardName) => {
    // 首先处理特殊情况，如大小王
    if (cardName === 'bj') return 'black_joker';
    if (cardName === 'rj') return 'red_joker';

    // 假设其他牌的名称格式已经是 "ace_of_spades"
    // 如果不是，我们可以在这里添加更复杂的映射
    // 但为了稳定，我们先假设默认格式是正确的
    if (typeof cardName === 'string' && cardName.includes('_of_')) {
        return cardName;
    }

    // 为 sK, hA 等格式提供一个映射
    const suitMap = { s: 'spades', h: 'hearts', d: 'diamonds', c: 'clubs' };
    const rankMap = {
        A: 'ace', K: 'king', Q: 'queen', J: 'jack', T: '10',
        '9': '9', '8': '8', '7': '7', '6': '6', '5': '5', '4': '4', '3': '3', '2': '2'
    };

    const suitChar = cardName?.charAt(0);
    const rankChar = cardName?.substring(1);
    const suit = suitMap[suitChar];
    const rank = rankMap[rankChar];

    if (suit && rank) {
        return `${rank}_of_${suit}`;
    }

    // 如果所有解析都失败，返回一个默认值以避免应用崩溃
    console.warn(`无法解析卡牌名称: "${cardName}"，将显示为默认卡牌。`);
    return 'red_joker'; // 默认回退图像
};


const Card = ({ cardName }) => {
    const finalCardName = getFinalCardName(cardName);
    const imageUrl = `${process.env.PUBLIC_URL}/cards/${finalCardName}.svg`;

    return (
        <div className="card">
            <img src={imageUrl} alt={cardName || 'card'} className="card-image" />
        </div>
    );
};

export default Card;
