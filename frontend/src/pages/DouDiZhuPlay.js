import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/DouDiZhuPlay.css';
import { sortCards, getHandType, compareHands } from '../CardUtils';

// Full deck of cards
const deck = [
    '3_of_diamonds', '3_of_clubs', '3_of_hearts', '3_of_spades', '4_of_diamonds', '4_of_clubs', '4_of_hearts', '4_of_spades',
    '5_of_diamonds', '5_of_clubs', '5_of_hearts', '5_of_spades', '6_of_diamonds', '6_of_clubs', '6_of_hearts', '6_of_spades',
    '7_of_diamonds', '7_of_clubs', '7_of_hearts', '7_of_spades', '8_of_diamonds', '8_of_clubs', '8_of_hearts', '8_of_spades',
    '9_of_diamonds', '9_of_clubs', '9_of_hearts', '9_of_spades', '10_of_diamonds', '10_of_clubs', '10_of_hearts', '10_of_spades',
    'jack_of_diamonds', 'jack_of_clubs', 'jack_of_hearts', 'jack_of_spades', 'queen_of_diamonds', 'queen_of_clubs', 'queen_of_hearts', 'queen_of_spades',
    'king_of_diamonds', 'king_of_clubs', 'king_of_hearts', 'king_of_spades', 'ace_of_diamonds', 'ace_of_clubs', 'ace_of_hearts', 'ace_of_spades',
    '2_of_diamonds', '2_of_clubs', '2_of_hearts', '2_of_spades', 'black_joker', 'red_joker'
];

// Main Game Component
function DouDiZhuPlay() {
    const navigate = useNavigate();
    // State Management
    const [hands, setHands] = useState([[], [], []]);
    const [landlord, setLandlord] = useState(null);
    const [turn, setTurn] = useState(0);
    const [landlordCards, setLandlordCards] = useState([]);
    const [isBidding, setIsBidding] = useState(true);
    const [lastPlay, setLastPlay] = useState({ cards: null, playedBy: null });
    const [selectedCards, setSelectedCards] = useState([]);
    const [winner, setWinner] = useState(null);
    const [passCount, setPassCount] = useState(0);

    const playerIndex = 0; // Human player is always at index 0

    // Initialize or reset the game
    const initializeGame = useCallback(() => {
        const shuffled = [...deck].sort(() => Math.random() - 0.5);
        const playerHands = [
            sortCards(shuffled.slice(0, 17)),
            sortCards(shuffled.slice(17, 34)),
            sortCards(shuffled.slice(34, 51))
        ];
        setHands(playerHands);
        setLandlordCards(shuffled.slice(51));
        setIsBidding(true);
        setLandlord(null);
        setTurn(0); // Start bidding from player 0
        setLastPlay({ cards: null, playedBy: null });
        setSelectedCards([]);
        setWinner(null);
        setPassCount(0);
    }, []);

    useEffect(() => {
        initializeGame();
    }, [initializeGame]);

    // AI Logic
    useEffect(() => {
        if (!isBidding && turn !== playerIndex && !winner) {
            const aiTurn = setTimeout(() => handleAIPlay(), 1200);
            return () => clearTimeout(aiTurn);
        }
    }, [turn, isBidding, winner]);

    const handleAIPlay = () => {
        // AI logic will be implemented in a future step
        // For now, it just passes the turn
        handlePlay(true);
    };

    // Card selection handler
    const handleCardClick = (card) => {
        if (winner) return;
        setSelectedCards(prev =>
            prev.includes(card) ? prev.filter(c => c !== card) : [...prev, card]
        );
    };

    // Bidding handler
    const handleBid = () => {
        if (winner) return;
        setLandlord(playerIndex);
        const newHands = [...hands];
        newHands[playerIndex] = sortCards([...hands[playerIndex], ...landlordCards]);
        setHands(newHands);
        setTurn(playerIndex);
        setIsBidding(false);
    };

    // Play or Pass handler
    const handlePlay = (isPass = false) => {
        if (winner) return;

        if (isPass) {
            if (lastPlay.playedBy === null || lastPlay.playedBy === turn) {
                alert("You can't pass when it's your turn to start.");
                return;
            }
            setPassCount(prev => prev + 1);
            if (passCount + 1 >= 2) {
                setLastPlay({ cards: null, playedBy: null }); // Reset last play
                setPassCount(0);
            }
            setTurn(prev => (prev + 1) % 3);
            return;
        }

        const handType = getHandType(selectedCards);
        if (handType.type === 'invalid') {
            alert('Invalid card combination.');
            return;
        }

        if (lastPlay.cards && !compareHands(selectedCards, lastPlay.cards)) {
            alert("Your hand doesn't beat the last play.");
            return;
        }

        const newHand = hands[turn].filter(card => !selectedCards.includes(card));
        const newHands = [...hands];
        newHands[turn] = newHand;

        setHands(newHands);
        setLastPlay({ cards: selectedCards, playedBy: turn });
        setSelectedCards([]);
        setPassCount(0);

        if (newHand.length === 0) {
            setWinner(turn === landlord ? 'Landlord' : 'Farmers');
        } else {
            setTurn(prev => (prev + 1) % 3);
        }
    };

    // Render a single card
    const renderCard = (card, isSelected, inPlayerHand = false) => (
        <img
            key={card}
            src={`/cards/${card}.svg`}
            alt={card}
            className={`card ${isSelected ? 'selected' : ''}`}
            onClick={inPlayerHand ? () => handleCardClick(card) : undefined}
        />
    );

    // Player Info Component
    const PlayerInfo = ({ index, name }) => {
        const isLandlord = landlord === index;
        const isActive = turn === index && !isBidding && !winner;
        return (
            <div className={`player-info ${isActive ? 'active' : ''}`}>
                <div className="player-avatar">
                    {name}
                    {isLandlord && <div className="landlord-icon" title="Landlord"></div>}
                </div>
                <div className="card-count">{hands[index].length} cards</div>
            </div>
        );
    };

    return (
        <div className="doudizhu-game-board">
            <button className="exit-button" onClick={() => navigate('/doudizhu')}>&lt; Exit</button>

            <div className="game-table">
                <div className="opponent-left"><PlayerInfo index={1} name="Player 2" /></div>
                <div className="landlord-cards-container">
                    <h3>Landlord's Cards</h3>
                    <div className="landlord-cards">
                        {landlordCards.map(card => <img key={card} src={`/cards/${card}.svg`} alt={card} className="card-sm" />)}
                    </div>
                </div>
                <div className="opponent-right"><PlayerInfo index={2} name="Player 3" /></div>

                <div className="last-play-container">
                    <div className="last-play">
                        {lastPlay.cards ? lastPlay.cards.map(card => renderCard(card, false)) : <span className="last-play-label">Play Area</span>}
                    </div>
                </div>

                <div className="player-area">
                    <PlayerInfo index={0} name="You" />
                    <div className="player-hand">
                        {hands[playerIndex].map(card => renderCard(card, selectedCards.includes(card), true))}
                    </div>
                    {turn === playerIndex && !isBidding && !winner && (
                        <div className="action-buttons">
                            <button className="play-btn" onClick={() => handlePlay(false)} disabled={selectedCards.length === 0}>Play</button>
                            <button className="pass-btn" onClick={() => handlePlay(true)}>Pass</button>
                        </div>
                    )}
                </div>
            </div>

            {isBidding && (
                <div className="overlay">
                    <div className="modal">
                        <h2>Bidding Phase</h2>
                        <p>Do you want to be the Landlord?</p>
                        <div className="bid-option">
                            <button className="bid-btn" onClick={handleBid}>Bid for Landlord</button>
                            {/* In a full game, there would be options to pass bidding */}
                        </div>
                    </div>
                </div>
            )}

            {winner && (
                <div className="overlay">
                    <div className="modal">
                        <h2>Game Over!</h2>
                        <p>{winner} win!</p>
                        <button className="restart-btn" onClick={initializeGame}>Play Again</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DouDiZhuPlay;
