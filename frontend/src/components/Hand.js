// frontend/src/components/Hand.js
import React, { useState } from 'react';
import Card from './Card';
import './styles/Hand.css';

/**
 * 玩家手牌组件，用于显示、选择和打出手牌
 * @param {string[]} initialCards - 玩家的初始手牌
 * @param {function} onPlay - "出牌"或"不出"时的回调函数，参数为选择的牌数组
 * @param {boolean} myTurn - 是否轮到当前玩家出牌
 */
const Hand = ({ initialCards, onPlay, myTurn }) => {
    const [cards, setCards] = useState([...initialCards]);
    const [selectedCards, setSelectedCards] = useState(new Set());

    // 卡牌选择逻辑
    const toggleCardSelection = (card) => {
        const newSelection = new Set(selectedCards);
        if (newSelection.has(card)) {
            newSelection.delete(card);
        } else {
            newSelection.add(card);
        }
        setSelectedCards(newSelection);
    };

    // 执行出牌操作
    const handlePlay = () => {
        if (!onPlay) return;
        const cardsToPlay = Array.from(selectedCards);
        onPlay(cardsToPlay);
        
        // 从手牌中移除已打出的牌 (乐观更新)
        setCards(prev => prev.filter(c => !selectedCards.has(c)));
        setSelectedCards(new Set());
    };
    
    // 执行“不出”操作
    const handlePass = () => {
        if (!onPlay) return;
        onPlay([]); // 传一个空数组表示PASS
        setSelectedCards(new Set()); // 清空选择
    };

    // TODO: 实现一个基于斗地主规则的排序函数
    const sortedHand = cards.sort(); 

    return (
        <div className="hand-container">
            <div className="hand-scroll-area">
                {sortedHand.map(card => (
                    <div
                        key={card}
                        className={`card-wrapper ${selectedCards.has(card) ? 'selected' : ''}`}
                        onClick={() => toggleCardSelection(card)}
                    >
                        <Card cardName={card} />
                    </div>
                ))}
            </div>
            
            {myTurn && (
                <div className="hand-actions">
                    <button onClick={handlePass}>不出</button>
                    <button onClick={handlePlay} disabled={selectedCards.size === 0}>
                        出牌
                    </button>
                </div>
            )}
        </div>
    );
};

export default Hand;
