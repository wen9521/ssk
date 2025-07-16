// frontend/src/components/Card.js
import React from 'react';
import './styles/Card.css';

/**
 * 将来自后端的卡牌标识符（例如 'sA', 'h10', 'bj'）
 * 转换为对应的SVG文件名（例如 'ace_of_spades', '10_of_hearts', 'black_joker'）。
 * 此函数现在更加健壮，能处理不同的后端格式。
 *
 * @param {string} cardName - 来自后端的卡牌标识符。
 * @returns {string} 卡牌SVG图像的文件名（不含扩展名）。
 */
const getFinalCardName = (cardName) => {
    // 首先处理特殊的小丑牌
    if (cardName === 'bj') return 'black_joker';
    if (cardName === 'rj') return 'red_joker';

    // 如果格式已经是正确的（例如 'ace_of_spades'），则直接返回
    if (typeof cardName === 'string' && cardName.includes('_of_')) {
        return cardName;
    }

    // 在处理前确保cardName是有效的字符串
    if (typeof cardName !== 'string' || cardName.length < 2) {
        console.warn(`收到了无效的卡牌名称: "${cardName}"。将使用默认卡牌。`);
        return 'red_joker'; // 对无效输入的后备处理
    }

    // 从后端花色字符到文件名部分的映射
    const suitMap = { s: 'spades', h: 'hearts', d: 'diamonds', c: 'clubs' };
    
    // 从后端等级字符到文件名部分的映射
    // 现在可以正确处理 '10' 和 'T' 作为牌 '十'
    const rankMap = {
        'A': 'ace', 'K': 'king', 'Q': 'queen', 'J': 'jack', 
        'T': '10', '10': '10', // 关键修复：同时处理 'T' 和 '10'
        '9': '9', '8': '8', '7': '7', '6': '6', '5': '5', '4': '4', '3': '3', '2': '2'
    };

    const suitChar = cardName.charAt(0).toLowerCase();
    const rankChar = cardName.substring(1); // 例如 'A', 'K', '10', '9'

    const suit = suitMap[suitChar];
    const rank = rankMap[rankChar];

    // 如果花色和等级都找到了，则构建文件名
    if (suit && rank) {
        return `${rank}_of_${suit}`;
    }

    // 如果解析失败，记录一个警告并返回一个默认卡牌以防止应用崩溃
    console.warn(`无法解析卡牌名称: "${cardName}"。将使用默认卡牌。`);
    return 'red_joker';
};

const Card = ({ cardName }) => {
    // 从卡牌标识符获取正确的图片文件名
    const finalCardName = getFinalCardName(cardName);
    
    // 构建到SVG图片的完整URL
    const imageUrl = `${process.env.PUBLIC_URL}/cards/${finalCardName}.svg`;

    return (
        <div className="card">
            <img src={imageUrl} alt={cardName || 'Card'} className="card-image" />
        </div>
    );
};

export default Card;
