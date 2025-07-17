import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Play.css'; // Shared styles, now with Big Two layout

const AI_NAMES = ['Player 2', 'Player 3', 'Player 4'];
const SAMPLE_HAND = [
  '3_of_diamonds', '4_of_spades', '5_of_clubs', '6_of_hearts', '7_of_diamonds',
  '8_of_clubs', '9_of_spades', '10_of_hearts', 'jack_of_diamonds', 'queen_of_clubs',
  'king_of_spades', 'ace_of_hearts', '2_of_diamonds'
];

function BigTwoPlay() {
  const navigate = useNavigate();
  const [msg, setMsg] = useState('Welcome to Big Two!');
  const [selectedCards, setSelectedCards] = useState([]);
  
  const [players, setPlayers] = useState([
    { name: 'You', isMe: true, isReady: true, cardCount: 13 },
    { name: AI_NAMES[0], isMe: false, isReady: true, cardCount: 13 },
    { name: AI_NAMES[1], isMe: false, isReady: true, cardCount: 13 },
    { name: AI_NAMES[2], isMe: false, isReady: true, cardCount: 13 },
  ]);

  const handlePlayCards = () => {
    if (selectedCards.length === 0) {
      setMsg('Please select cards to play.');
      return;
    }
    setMsg(`You played ${selectedCards.length} cards.`);
    // Logic to remove cards from hand would go here
  };
  
  const handleCardClick = (card) => {
    setSelectedCards(prev => 
      prev.includes(card) ? prev.filter(c => c !== card) : [...prev, card]
    );
  };

  const renderPlayerSeat = (player) => {
    return (
      <div className={`play-seat ${player.isMe ? 'me' : 'ai-done'}`}>
        <div>{player.name}</div>
        <div className="play-seat-status">
           {`Cards: ${player.cardCount}`}
        </div>
      </div>
    );
  };
  
  const me = players.find(p => p.isMe);
  const otherPlayers = players.filter(p => !p.isMe);
  
  return (
    <div className="play-container big-two-game-container">
      {/* Header is removed for a more immersive game view, can be added back if needed */}
      
      <div className="player-top">
        {otherPlayers[1] && renderPlayerSeat(otherPlayers[1])}
      </div>
      <div className="player-left">
        {otherPlayers[0] && renderPlayerSeat(otherPlayers[0])}
      </div>
      
      <div className="play-area">
        {/* Played cards will be rendered here */}
        <span>Play Area</span>
      </div>
      
      <div className="player-right">
        {otherPlayers[2] && renderPlayerSeat(otherPlayers[2])}
      </div>
      
      <div className="my-area">
        <div className="my-hand">
            {SAMPLE_HAND.map(card => (
              <img 
                key={card}
                src={`/cards/${card}.svg`}
                alt={card}
                className={`card ${selectedCards.includes(card) ? 'selected' : ''}`}
                onClick={() => handleCardClick(card)}
              />
            ))}
        </div>
        <div className="my-controls">
           {me && renderPlayerSeat(me)}
           <div className="buttons-container">
              <button
                className="action-button ready-button" // Using generic class from Play.css
                onClick={() => setMsg('You passed.')}
              >
                Pass
              </button>
              <button
                className="action-button start-compare-button" // Using generic class from Play.css
                onClick={handlePlayCards}
              >
                Play Cards
              </button>
           </div>
        </div>
        <div className="message-display">
          {msg}
        </div>
      </div>
    </div>
  );
}

export default BigTwoPlay;
