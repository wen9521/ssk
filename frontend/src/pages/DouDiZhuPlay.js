import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Play.css';
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

    const handleBid = (playerIndex) => {
        setLandlord(playerIndex);
        const newHands = [...hands];
        newHands[playerIndex] = sortCards([...hands[playerIndex], ...landlordCards]);
        setHands(newHands);
        setTurn(playerIndex);
        setBidding(false);
    };

    const handlePlay = (cards) => {
        // Basic play validation
        if (lastPlay && cards.length !== lastPlay.length) {
            alert('Invalid play');
            return;
        }
        const newHand = hands[turn].filter(card => !cards.includes(card));
        const newHands = [...hands];
        newHands[turn] = newHand;
        setHands(newHands);
        setLastPlay(cards);
        setTurn((turn + 1) % 3);
    };

    return (
        <div className="play-container">
            <div className="play-inner-wrapper">
                <div className="header-controls">
                    <button className="exit-button" onClick={() => navigate('/doudizhu')}>&lt; 返回入口</button>
                </div>
                <div className="game-table-area">
                    {bidding ? (
                        <div>
                            <h3>叫地主</h3>
                            {hands.map((hand, index) => (
                                <button key={index} onClick={() => handleBid(index)}>玩家 {index + 1} 叫地主</button>
                            ))}
                        </div>
                    ) : (
                        <>
                            <div>地主牌: {landlordCards.map(card => <img key={card} src={`/cards/${card}.svg`} alt={card} className="card-sm" />)}</div>
                            {hands.map((hand, index) => (
                                <div key={index} className={`player-hand ${index === turn ? 'active' : ''}`}>
                                    <h3>玩家 {index + 1} {index === landlord ? '(地主)' : ''}</h3>
                                    <div className="hand">
                                        {hand.map(card => (
                                            <img key={card} src={`/cards/${card}.svg`} alt={card} className="card" />
                                        ))}
                                    </div>
                                    {index === turn && (
                                        <button onClick={() => handlePlay([hand[0]])}>出牌</button>
                                    )}
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default DouDiZhuPlay;