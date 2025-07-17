import React, { useState, useEffect } from 'react';
import { sortCards } from '../CardUtils';

const ThirteenWaterPlay = () => {
  const [hand, setHand] = useState([]);

  useEffect(() => {
    // Sample hand for now
    const sampleHand = [
      '2_of_hearts', '3_of_diamonds', '4_of_spades', '5_of_clubs', '6_of_hearts',
      '7_of_diamonds', '8_of_spades', '9_of_clubs', '10_of_hearts', 'jack_of_diamonds',
      'queen_of_spades', 'king_of_clubs', 'ace_of_hearts'
    ];
    setHand(sortCards(sampleHand));
  }, []);

  return (
    <div>
      <h1>Thirteen Water Play</h1>
      <div>
        <h2>Your Hand</h2>
        <div className="hand">
          {hand.map(card => (
            <img key={card} src={`/cards/${card}.svg`} alt={card} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThirteenWaterPlay;
