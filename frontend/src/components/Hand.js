// frontend/src/components/Hand.js
import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import Card from './Card';
import './styles/Hand.css';

function Hand({ myTurn }) {
    const { hand, isLoading, handlePlayCard } = useGame();
    const [selectedCards, setSelectedCards] = useState(new Set());

    useEffect(() => {
        setSelectedCards(new Set());
    }, [hand]);

    const toggleCardSelection = (card) => {
        const newSelection = new Set(selectedCards);
        if (newSelection.has(card)) {
            newSelection.delete(card);
        } else {
            newSelection.add(card);
        }
        setSelectedCards(newSelection);
    };

    const onPlay = () => {
        handlePlayCard(Array.from(selectedCards));
    };

    const onPass = () => {
        handlePlayCard([]);
    };

    // TODO: 实现一个基于游戏规则的排序函数
    const sortedHand = hand;

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
                    <button onClick={onPass} disabled={isLoading}>Pass</button>
                    <button onClick={onPlay} disabled={isLoading || selectedCards.size === 0}>出牌</button>
                </div>
            )}
        </div>
    );
}

export default Hand;
