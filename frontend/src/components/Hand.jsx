import React, { useState, useEffect } from 'react';
import { toCardFilename } from '../utils/card-utils';
import './Hand.css';

function Hand({ cards, onSubmit, gameStatus }) {
    const [unassigned, setUnassigned] = useState([]);
    const [head, setHead] = useState([]);
    const [middle, setMiddle] = useState([]);
    const [tail, setTail] = useState([]);
    const [selectedCards, setSelectedCards] = useState([]);

    useEffect(() => {
        setUnassigned(cards);
        // Reset state when new cards are dealt
        setHead([]);
        setMiddle([]);
        setTail([]);
        setSelectedCards([]);
    }, [cards]);

    const handleCardClick = (card, area) => {
        // Toggle selection
        if (selectedCards.includes(card)) {
            setSelectedCards(selectedCards.filter(c => c !== card));
        } else {
            setSelectedCards([...selectedCards, card]);
        }
    };

    const moveSelectedTo = (targetArea) => {
        if (selectedCards.length === 0) return;

        // Logic to move cards between areas (unassigned, head, middle, tail)
        // This is a simplified version. A full implementation would need more robust state management.
        
        let newUnassigned = [...unassigned];
        let newHead = [...head];
        let newMiddle = [...middle];
        let newTail = [...tail];

        // Remove from all areas first
        newUnassigned = newUnassigned.filter(c => !selectedCards.includes(c));
        newHead = newHead.filter(c => !selectedCards.includes(c));
        newMiddle = newMiddle.filter(c => !selectedCards.includes(c));
        newTail = newTail.filter(c => !selectedCards.includes(c));

        // Add to the target area
        if (targetArea === 'head') newHead.push(...selectedCards);
        if (targetArea === 'middle') newMiddle.push(...selectedCards);
        if (targetArea === 'tail') newTail.push(...selectedCards);
        if (targetArea === 'unassigned') newUnassigned.push(...selectedCards);

        setUnassigned(newUnassigned);
        setHead(newHead);
        setMiddle(newMiddle);
        setTail(newTail);
        setSelectedCards([]); // Clear selection
    };

    const renderCard = (card, area) => {
        const cardFilename = toCardFilename(card);
        const isSelected = selectedCards.includes(card);
        return (
            <img
                key={card}
                src={`/assets/cards/${cardFilename}.svg`}
                alt={card}
                className={`card-img ${isSelected ? 'selected' : ''}`}
                onClick={() => handleCardClick(card, area)}
            />
        );
    };

    const renderDun = (cards, areaName, limit) => (
        <div className="dun-area" onClick={() => moveSelectedTo(areaName)}>
            <div className="dun-header">{areaName.toUpperCase()} ({cards.length}/{limit})</div>
            <div className="card-container">
                {cards.map(card => renderCard(card, areaName))}
            </div>
        </div>
    );
    
    const isSubmitDisabled = head.length !== 3 || middle.length !== 5 || tail.length !== 5 || gameStatus !== 'playing';

    const handleSubmit = () => {
        if (!isSubmitDisabled) {
            onSubmit({ head, middle, tail });
        }
    };

    if (gameStatus !== 'playing' && gameStatus !== 'dealing') {
        return <div className="hand-container-hidden"></div>;
    }

    return (
        <div className="hand-container">
            <div className="unassigned-area">
                <div className="dun-header">你的手牌 ({unassigned.length})</div>
                <div className="card-container">
                    {unassigned.map(card => renderCard(card, 'unassigned'))}
                </div>
            </div>
            <div className="duns-container">
                {renderDun(head, 'head', 3)}
                {renderDun(middle, 'middle', 5)}
                {renderDun(tail, 'tail', 5)}
            </div>
            <button
                className="btn-submit-hand"
                onClick={handleSubmit}
                disabled={isSubmitDisabled}
            >
                提交牌组
            </button>
        </div>
    );
}

export default Hand;
