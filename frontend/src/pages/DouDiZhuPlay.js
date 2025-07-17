import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/DouDiZhuPlay.css';
import { sortCards } from '../CardUtils';

const deck = [
    '3_of_diamonds', '3_of_clubs', '3_of_hearts', '3_of_spades',
    '4_of_diamonds', '4_of_clubs', '4_of_hearts', '4_of_spades',
    '5_of_diamonds', '5_of_clubs', '5_of_hearts', '5_of_spades',
    '6_of_diamonds', '6_of_clubs', '6_of_hearts', '6_of_spades',
    '7_of_diamonds', '7_of_clubs', '7_of_hearts', '7_of_spades',
    '8_of_diamonds', '8_of_clubs', '8_of_hearts', '8_of_spades',
    '9_of_diamonds', '9_of_clubs', '9_of_hearts', '9_of_spades',
    '10_of_diamonds', '10_of_clubs', '10_of_hearts', '10_of_spades',
    'jack_of_diamonds', 'jack_of_clubs', 'jack_of_hearts', 'jack_of_spades',
    'queen_of_diamonds', 'queen_of_clubs', 'queen_of_hearts', 'queen_of_spades',
    'king_of_diamonds', 'king_of_clubs', 'king_of_hearts', 'king_of_spades',
    'ace_of_diamonds', 'ace_of_clubs', 'ace_of_hearts', 'ace_of_spades',
    '2_of_diamonds', '2_of_clubs', '2_of_hearts', '2_of_spades',
    'black_joker', 'red_joker'
];

function DouDiZhuPlay() {
    const navigate = useNavigate();
    const [hands, setHands] = useState([[], [], []]);
    const [landlord, setLandlord] = useState(null);
    const [turn, setTurn] = useState(null);
    const [landlordCards, setLandlordCards] = useState([]);
    const [bidding, setBidding] = useState(true);
    const [lastPlay, setLastPlay] = useState(null);
    const [selectedCards, setSelectedCards] = useState([]);

    useEffect(() => {
        const shuffled = [...deck].sort(() => Math.random() - 0.5);
        const playerHands = [
            sortCards(shuffled.slice(0, 17)),
            sortCards(shuffled.slice(17, 34)),
            sortCards(shuffled.slice(34, 51))
        ];
        setHands(playerHands);
        setLandlordCards(shuffled.slice(51));
        setBidding(true);
    }, []);
    
    const handleCardClick = (card) => {
        setSelectedCards(prev => 
            prev.includes(card) ? prev.filter(c => c !== card) : [...prev, card]
        );
    };

    const handleBid = (playerIndex) => {
        setLandlord(playerIndex);
        const newHands = [...hands];
        newHands[playerIndex] = sortCards([...hands[playerIndex], ...landlordCards]);
        setHands(newHands);
        setTurn(playerIndex);
        setBidding(false);
    };

    const handlePlay = () => {
        // Basic play validation
        if (lastPlay && selectedCards.length !== lastPlay.length) {
            alert('Invalid play');
            return;
        }
        const newHand = hands[turn].filter(card => !selectedCards.includes(card));
        const newHands = [...hands];
        newHands[turn] = newHand;
        setHands(newHands);
        setLastPlay(selectedCards);
        setSelectedCards([]);
        setTurn((turn + 1) % 3);
    };
    
    const renderCard = (card, isSelected) => (
        <img 
            key={card}
            src={`/cards/${card}.svg`}
            alt={card}
            className={`card ${isSelected ? 'selected' : ''}`}
            onClick={() => handleCardClick(card)}
        />
    );

    return (
        <div className="doudizhu-game-board">
            <button className="exit-button" onClick={() => navigate('/doudizhu')}>&lt; 返回入口</button>
            <div className="game-table">
                {bidding ? (
                    <div className="bidding-overlay">
                        <h2>叫地主阶段</h2>
                        {hands.map((hand, index) => (
                             <div key={index} className="bid-option">
                                <span>玩家 {index + 1}</span>
                                <button onClick={() => handleBid(index)}>叫地主</button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="opponent-hand opponent-top">
                            <p>玩家 {(turn + 1) % 3 + 1} {((turn + 1) % 3) === landlord ? '(地主)' : ''}</p>
                            <div className="card-row-opponent">
                                {hands[(turn + 1) % 3].map(() => <div key={Math.random()} className="card-back" />)}
                            </div>
                        </div>
                        <div className="center-area">
                             <div className="landlord-cards">
                                {landlordCards.map(card => <img key={card} src={`/cards/${card}.svg`} alt={card} className="card-sm" />)}
                            </div>
                            <div className="last-play">
                                {lastPlay && lastPlay.map(card => <img key={card} src={`/cards/${card}.svg`} alt={card} className="card-sm" />)}
                            </div>
                        </div>
                        <div className="opponent-hand opponent-bottom">
                             <p>玩家 {(turn + 2) % 3 + 1} {((turn + 2) % 3) === landlord ? '(地主)' : ''}</p>
                             <div className="card-row-opponent">
                                {hands[(turn + 2) % 3].map(() => <div key={Math.random()} className="card-back" />)}
                            </div>
                        </div>
                        <div className="player-area">
                            <p>你 (玩家 {turn + 1}) {turn === landlord ? '(地主)' : ''}</p>
                            <div className="card-row-player">
                                {hands[turn].map(card => renderCard(card, selectedCards.includes(card)))}
                            </div>
                            <div className="action-buttons">
                                <button onClick={() => handlePlay()}>出牌</button>
                                <button>不出</button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default DouDiZhuPlay;
