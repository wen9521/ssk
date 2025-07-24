import React, { useState, useEffect, useRef } from 'react';
import GameBoard from './GameBoard';
import { createDeck, shuffleDeck, dealCards } from '../game-logic/deck';
import { compareHands } from '../game-logic/thirteen-water';

const WEBSOCKET_URL = 'ws://localhost:8080';

function Game({ isOnline = false }) {
  const [gameState, setGameState] = useState({
    player: { name: 'Player', hand: [], plays: [], cardCount: 13, canCompare: false },
    opponent: { name: 'Opponent', hand: [], plays: [], cardCount: 13 },
    message: 'Your turn to play.',
    result: null,
  });

  const ws = useRef(null);

  useEffect(() => {
    if (isOnline) {
      ws.current = new WebSocket(WEBSOCKET_URL);
      ws.current.onopen = () => console.log('WebSocket connected');
      ws.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        setGameState(message);
      };
      ws.current.onclose = () => console.log('WebSocket disconnected');

      return () => {
        ws.current.close();
      };
    } else {
      // Offline mode: initialize the game locally
      const deck = createDeck();
      const shuffledDeck = shuffleDeck(deck);
      const [playerHand, opponentHand] = dealCards(shuffledDeck, 13, 2);

      setGameState(prev => ({
        ...prev,
        player: { ...prev.player, hand: playerHand, cardCount: playerHand.length },
        opponent: { ...prev.opponent, hand: opponentHand, cardCount: opponentHand.length },
      }));
    }
  }, [isOnline]);

  const sendGameState = (newState) => {
    if (isOnline && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(newState));
    }
    setGameState(newState);
  };

  const handlePlay = (playedCards) => {
    const newState = { ...gameState };
    const newHand = gameState.player.hand.filter(card => 
        !playedCards.find(playedCard => playedCard.rank === card.rank && playedCard.suit === card.suit)
    );
    newState.player = {
      ...newState.player,
      hand: newHand,
      plays: [...newState.player.plays, { cards: playedCards, type: 'play' }],
      canCompare: newHand.length === 0,
    };
    newState.message = 'You played. Click Compare when you are done.';
    sendGameState(newState);
  };

  const handleCompare = () => {
    const newState = { ...gameState };
    newState.result = { message: 'Comparison logic not yet implemented.' };
    sendGameState(newState);
  };

  const handleRestart = () => {
    const deck = createDeck();
    const shuffledDeck = shuffleDeck(deck);
    const [playerHand, opponentHand] = dealCards(shuffledDeck, 13, 2);

    const newState = {
        player: { name: 'Player', hand: playerHand, plays: [], cardCount: playerHand.length, canCompare: false },
        opponent: { name: 'Opponent', hand: opponentHand, plays: [], cardCount: opponentHand.length },
        message: 'Your turn to play.',
        result: null,
    };
    sendGameState(newState);
  };

  return (
    <div className="game-container">
      <GameBoard
        player={gameState.player}
        opponent={gameState.opponent}
        onPlay={handlePlay}
        onCompare={handleCompare}
        message={gameState.message}
        result={gameState.result}
        onRestart={handleRestart}
      />
    </div>
  );
}

export default Game;
