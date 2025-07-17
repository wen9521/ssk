import React, { useState, useEffect } from 'react';
import { sortCards } from '../CardUtils';
import '../styles/ThirteenWaterPlay.css'; // New CSS file for the play area

const ThirteenWaterPlay = () => {
  const [hand, setHand] = useState([]);
  const [frontDun, setFrontDun] = useState([]);
  const [middleDun, setMiddleDun] = useState([]);
  const [backDun, setBackDun] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);

  useEffect(() => {
    // Using a consistent sample hand for development
    const sampleHand = [
      '2_of_hearts', '3_of_diamonds', 'ace_of_spades', '5_of_clubs', '6_of_hearts',
      '7_of_diamonds', '8_of_spades', '9_of_clubs', '10_of_hearts', 'jack_of_diamonds',
      'queen_of_spades', 'king_of_clubs', 'ace_of_hearts'
    ];
    setHand(sortCards(sampleHand));
  }, []);

  const handleCardClick = (card, source, sourceIndex) => {
    if (selectedCard && selectedCard.card === card) {
      setSelectedCard(null); // Deselect if clicking the same card
    } else {
      setSelectedCard({ card, source, sourceIndex });
    }
  };

  const handleDunClick = (dunName) => {
    if (!selectedCard) return; // Nothing to move

    const { card, source } = selectedCard;
    
    // Logic to move card from source to destination
    const dunMap = {
      front: { get: frontDun, set: setFrontDun, limit: 3 },
      middle: { get: middleDun, set: setMiddleDun, limit: 5 },
      back: { get: backDun, set: setBackDun, limit: 5 },
      hand: { get: hand, set: setHand, limit: 13}
    };

    const targetDun = dunMap[dunName];
    if (targetDun.get.length >= targetDun.limit) {
      alert(`This dun is full!`);
      return;
    }

    // Remove from source
    if (source !== 'hand') {
        const sourceDun = dunMap[source];
        sourceDun.set(prev => prev.filter(c => c !== card));
    } else {
        setHand(prev => prev.filter(c => c !== card));
    }


    // Add to destination
    targetDun.set(prev => sortCards([...prev, card]));

    setSelectedCard(null); // Clear selection after move
  };
  
  const renderCard = (card, source, index) => (
    <img
      key={card}
      src={`/cards/${card}.svg`}
      alt={card}
      className={`card ${selectedCard?.card === card ? 'selected' : ''}`}
      onClick={() => handleCardClick(card, source, index)}
    />
  );
  
   const handleReset = () => {
    const allCards = [...hand, ...frontDun, ...middleDun, ...backDun];
    setHand(sortCards(allCards));
    setFrontDun([]);
    setMiddleDun([]);
    setBackDun([]);
    setSelectedCard(null);
  };

  return (
    <div className="game-board">
      <h1>十三水战场</h1>
      <p>点击卡牌，然后点击目标墩位来理牌。</p>

      <div className="duns-container">
        <div className="dun-area" onClick={() => handleDunClick('back')}>
          <h2>后墩 (5张)</h2>
          <div className="card-row">{backDun.map((c, i) => renderCard(c, 'back', i))}</div>
        </div>
        <div className="dun-area" onClick={() => handleDunClick('middle')}>
          <h2>中墩 (5张)</h2>
          <div className="card-row">{middleDun.map((c, i) => renderCard(c, 'middle', i))}</div>
        </div>
        <div className="dun-area" onClick={() => handleDunClick('front')}>
          <h2>前墩 (3张)</h2>
          <div className="card-row">{frontDun.map((c, i) => renderCard(c, 'front', i))}</div>
        </div>
      </div>

      <div className="hand-container">
        <h2>你的手牌</h2>
        <div className="card-row">
          {hand.map((c, i) => renderCard(c, 'hand', i))}
        </div>
      </div>
      
      <div className="game-actions">
        <button className="confirm-btn">确认理牌</button>
        <button className="reset-btn" onClick={handleReset}>重置</button>
      </div>
    </div>
  );
};

export default ThirteenWaterPlay;