// frontend/src/components/Card.js
import React from 'react';
import './styles/Card.css';

const cardNameMapping = {
    'bj': 'black_joker',
    'rj': 'red_joker',
};

const Card = ({ cardName }) => {
    // 检查是否有特殊的名称映射，否则使用原名称
    const finalCardName = cardNameMapping[cardName] || cardName;

    // 根据 cardName (e.g., 'ace_of_spades') 构建SVG图片的路径
    // SVG 文件应该位于 /public/cards/ 目录下
    const imageUrl = `${process.env.PUBLIC_URL}/cards/${finalCardName}.svg`;

    return (
        <div className="card">
            <img src={imageUrl} alt={cardName} className="card-image" />
        </div>
    );
};

export default Card;
