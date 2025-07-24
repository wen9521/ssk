import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GameBoard from './GameBoard';
import { useGameStore, STAGES } from '../utils/store';
import { createDeck, shuffleDeck } from '../game-logic/deck';

export default function Play() {
  const navigate = useNavigate();
  const { stage, players, setStage, dealNewRound, setFinalResults, updatePlayerStatus } = useGameStore();

  useEffect(() => {
    // Start a new round as soon as the component mounts
    handlePlayAgain();
  }, []); // We can remove dealNewRound from dependencies if handlePlayAgain covers it

  const handleSubmit = async (mySortedHand) => {
    setStage(STAGES.SUBMITTED);
    
    const payload = players.map(player => {
      if (player.id === 'player1') {
        return { id: player.id, hands: mySortedHand };
      }
      // For AI/opponents, send their full hand for backend processing
      return { id: player.id, cards: player.cards };
    });

    try {
      const response = await fetch('/api/v1/thirteen-water/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Backend calculation failed');
      }

      const results = await response.json();
      setFinalResults(results);

    } catch (error) {
      console.error('Error submitting hand:', error);
      setStage(STAGES.PLAYING); 
    }
  };

  const handlePlayAgain = () => {
    const deck = createDeck();
    const shuffled = shuffleDeck(deck);
    const hands = [
      shuffled.slice(0, 13),
      shuffled.slice(13, 26),
      shuffled.slice(26, 39),
      shuffled.slice(39, 52),
    ];
    dealNewRound(hands);
  };

  const handleReady = (isReady) => {
    updatePlayerStatus('player1', { submitted: isReady });
    // In a real multiplayer game, this would also emit an event to the server
    console.log(`Player ${'player1'} is ${isReady ? 'ready' : 'not ready'}`);
  };

  const handleQuit = () => {
    navigate('/');
  };

  // Ensure players array is not empty before rendering
  if (!players || players.length === 0) {
    return <div>Loading...</div>;
  }

  return (
    <GameBoard
      players={players}
      myPlayerId="player1"
      onCompare={handleSubmit}
      onRestart={handlePlayAgain}
      onReady={handleReady}
      onQuit={handleQuit}
    />
  );
}
