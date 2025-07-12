// frontend/src/components/Card.js
import React from 'react';
import './styles/Card.css';

const Card = ({ cardName }) => {
    // 根据 cardName (e.g., 'ace_of_spades') 构建SVG图片的路径
    // SVG 文件应该位于 /public/cards/ 目录下
    const imageUrl = `${process.env.PUBLIC_URL}/cards/${cardName}.svg`;

    return (
        <div className="card">
            <img src={imageUrl} alt={cardName} className="card-image" />
        </div>
    );
};

export default Card;
