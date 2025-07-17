import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/DouDiZhuPlay.css';
import { sortCards, getHandType, compareHands } from '../CardUtils';

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
    const [selectedCards, setSelectedCards] = useState(null);
    const [winner, setWinner] = useState(null); // New state for winner

    const initializeGame = () => {
        const shuffled = [...deck].sort(() => Math.random() - 0.5);
        const playerHands = [
            sortCards(shuffled.slice(0, 17)),
            sortCards(shuffled.slice(17, 34)),
            sortCards(shuffled.slice(34, 51))
        ];
        setHands(playerHands);
        setLandlordCards(shuffled.slice(51));
        setBidding(true);
        setLandlord(null);
        setTurn(null);
        setLastPlay(null);
        setSelectedCards(null);
        setWinner(null);
    };

    useEffect(() => {
        initializeGame();
    }, []);

    // Helper to get all combinations of a certain size from an array
    const getCombinations = (array, size) => {
        const result = [];
        function backtrack(combination, startIdx) {
            if (combination.length === size) {
                result.push([...combination]);
                return;
            }
            for (let i = startIdx; i < array.length; i++) {
                combination.push(array[i]);
                backtrack(combination, i + 1);
                combination.pop();
            }
        }
        backtrack([], 0);
        return result;
    };

    // Find all possible valid plays from a hand given the last played cards
    const findValidPlays = (currentHand, lastPlayedCards) => {
        const validPlays = [];
        const maxLen = 8; 

        for (let i = 1; i <= Math.min(currentHand.length, maxLen); i++) {
            const combinations = getCombinations(currentHand, i);
            for (const combo of combinations) {
                const handType = getHandType(combo);
                if (handType.type !== 'invalid') {
                    if (!lastPlayedCards || compareHands(combo, lastPlayedCards.cards)) {
                        validPlays.push({ cards: combo, type: handType });
                    }
                }
            }
        }

        const bombsAndRockets = getCombinations(currentHand, 2)
            .concat(getCombinations(currentHand, 4))
            .filter(combo => {
                const type = getHandType(combo);
                return type.type === 'rocket' || type.type === 'bomb';
            });

        for (const bombOrRocket of bombsAndRrockets) {
            const handType = getHandType(bombOrRocket);
            if (handType.type !== 'invalid') {
                if (!lastPlayedCards || compareHands(bombOrRocket, lastPlayedCards.cards)) {
                     validPlays.push({ cards: bombOrRocket, type: handType });
                }
            }
        }

        return validPlays.sort((a, b) => {
            if (a.cards.length !== b.cards.length) {
                return a.cards.length - b.cards.length;
            }
            return a.type.rank - b.type.rank;
        });
    };

    // AI Play Logic
    useEffect(() => {
        if (!bidding && turn !== null && turn !== getPlayerIndex() && !winner) { // It's an AI's turn and no winner yet
            const aiPlayerIndex = turn;
            const aiHand = hands[aiPlayerIndex];
            
            const possiblePlays = findValidPlays(aiHand, lastPlay);
            
            let bestPlay = null;

            if (lastPlay === null || lastPlay.playedBy === turn) { 
                const nonBombPlays = possiblePlays.filter(p => p.type.type !== 'bomb' && p.type.type !== 'rocket');
                if (nonBombPlays.length > 0) {
                    bestPlay = nonBombPlays[0]; 
                } else if (possiblePlays.length > 0) {
                    bestPlay = possiblePlays[0]; 
                }
            } else { 
                const beatingPlays = possiblePlays.filter(p => compareHands(p.cards, lastPlay.cards));
                const nonBombBeatingPlays = beatingPlays.filter(p => p.type.type !== 'bomb' && p.type.type !== 'rocket');

                if (nonBombBeatingPlays.length > 0) {
                    bestPlay = nonBombBeatingPlays[0]; 
                } else if (beatingPlays.length > 0) {
                    bestPlay = beatingPlays[0]; 
                }
            }

            setTimeout(() => {
                if (bestPlay) {
                    const playCards = bestPlay.cards;
                    const newHand = aiHand.filter(card => !playCards.includes(card));
                    const newHands = [...hands];
                    newHands[aiPlayerIndex] = newHand;
                    setHands(newHands);
                    setLastPlay({ cards: playCards, playedBy: aiPlayerIndex, type: bestPlay.type.type, passed: 0 });

                    if (newHand.length === 0) { // Check if AI won
                        setWinner(aiPlayerIndex === landlord ? 'landlord' : 'farmer');
                    } else {
                        setTurn((prevTurn) => (prevTurn + 1) % 3);
                    }
                } else {
                    setLastPlay(prev => ({
                        ...prev, 
                        passed: (prev.playedBy === (turn + 2) % 3 && prev.passed === 1) ? 2 : ((prev.playedBy === (turn + 1) % 3 && prev.passed === 0) ? 1 : 0), 
                        playedBy: prev.playedBy 
                    })); 
                    setTurn((prevTurn) => (prevTurn + 1) % 3);
                }
            }, 1000); 
        }
    }, [turn, bidding, hands, lastPlay, winner, landlord]);

    const getPlayerIndex = () => {
        return 0;
    };

    const handleCardClick = (card) => {
        if (winner) return; // Disable card clicks if game is over
        setSelectedCards(prev => 
            prev.includes(card) ? prev.filter(c => c !== card) : [...prev, card]
        );
    };

    const handleBid = (playerIndex) => {
        if (winner) return; // Disable bidding if game is over
        setLandlord(playerIndex);
        const newHands = [...hands];
        newHands[playerIndex] = sortCards([...hands[playerIndex], ...landlordCards]);
        setHands(newHands);
        setTurn(playerIndex);
        setBidding(false);
    };

    const handlePlay = (isPass = false) => {
        if (winner) return; // Disable play if game is over

        if (isPass) {
            if (!lastPlay || lastPlay.playedBy === turn) { 
                alert('你是第一手出牌，不能选择不出！');
                return;
            }
            setSelectedCards([]); 
            setLastPlay(prev => ({
                ...prev, 
                passed: (prev.playedBy === (turn + 2) % 3 && prev.passed === 1) ? 2 : ((prev.playedBy === (turn + 1) % 3 && prev.passed === 0) ? 1 : 0), 
                playedBy: prev.playedBy 
            })); 
            setTurn((prevTurn) => (prevTurn + 1) % 3);
            return;
        }

        if (selectedCards.length === 0) {
            alert('请选择要出的牌！');
            return;
        }

        const newHandType = getHandType(selectedCards);

        if (newHandType.type === 'invalid') {
            alert('所选牌型不符合斗地主规则，请重新选择！');
            return;
        }

        let currentLastPlay = lastPlay;

        if (lastPlay === null || lastPlay.playedBy === turn || (lastPlay && lastPlay.passed === 2 && lastPlay.playedBy !== turn)) {
            currentLastPlay = null; 
        }

        if (currentLastPlay) {
            if (!compareHands(selectedCards, currentLastPlay.cards)) {
                alert('所选牌无法压制上家，请重新选择！');
                return;
            }
        }

        const newHand = hands[turn].filter(card => !selectedCards.includes(card));
        const newHands = [...hands];
        newHands[turn] = newHand;
        setHands(newHands);
        setLastPlay({ cards: selectedCards, playedBy: turn, type: newHandType.type, passed: 0 });
        setSelectedCards([]);
        
        if (newHand.length === 0) { // Check if current player won
            setWinner(turn === landlord ? 'landlord' : 'farmer');
        } else {
            setTurn((prevTurn) => (prevTurn + 1) % 3);
        }
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
                            <p>玩家 {((landlord + 1) % 3) + 1} {((landlord + 1) % 3) === landlord ? '(地主)' : ''} {((landlord + 1) % 3) === turn ? '(轮到TA出牌)' : ''}</p>
                            <div className="card-row-opponent">
                                {hands[(landlord + 1) % 3].map(() => <div key={Math.random()} className="card-back" />)}
                            </div>
                        </div>
                        <div className="center-area">
                             <div className="landlord-cards">
                                {landlordCards.map(card => <img key={card} src={`/cards/${card}.svg`} alt={card} className="card-sm" />)}
                            </div>
                            <div className="last-play">
                                {lastPlay && lastPlay.cards.map(card => <img key={card} src={`/cards/${card}.svg`} alt={card} className="card-sm" />)}
                            </div>
                        </div>
                        <div className="opponent-hand opponent-bottom">
                             <p>玩家 {((landlord + 2) % 3) + 1} {((landlord + 2) % 3) === landlord ? '(地主)' : ''} {((landlord + 2) % 3) === turn ? '(轮到TA出牌)' : ''}</p>
                             <div className="card-row-opponent">
                                {hands[(landlord + 2) % 3].map(() => <div key={Math.random()} className="card-back" />)}
                            </div>
                        </div>
                        <div className="player-area">
                            <p>你 (玩家 {getPlayerIndex() + 1}) {getPlayerIndex() === landlord ? '(地主)' : ''} {getPlayerIndex() === turn ? '(轮到你出牌)' : ''}</p>
                            <div className="card-row-player">
                                {hands[getPlayerIndex()].map(card => renderCard(card, selectedCards && selectedCards.includes(card)))}
                            </div>
                            <div className="action-buttons">
                                <button onClick={() => handlePlay(false)} disabled={selectedCards === null || selectedCards.length === 0 || (lastPlay !== null && lastPlay.playedBy !== turn && !compareHands(selectedCards, lastPlay.cards)) || winner}>出牌</button>
                                <button onClick={() => handlePlay(true)} disabled={lastPlay === null || lastPlay.playedBy === turn || winner}>不出</button>
                            </div>
                        </div>
                    </>
                )}
                {winner && (
                    <div className="game-over-overlay">
                        <div className="game-over-modal">
                            <h2>游戏结束！</h2>
                            <p>{winner === 'landlord' ? '地主胜利！' : '农民胜利！'}</p>
                            <button onClick={initializeGame}>再玩一局</button>
                            <button onClick={() => navigate('/doudizhu')}>返回入口</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default DouDiZhuPlay;