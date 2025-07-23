import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GameBoard from './GameBoard';
import Hand from './Hand';
import { useGameStore, STAGES } from '../utils/store';
import { createDeck, shuffleDeck } from '../game-logic/deck';
import './Play.css';

// The new, simplified, HTTP-based Play component
export default function Play() {
  const navigate = useNavigate();
  // Get state and actions from our central store
  const { stage, players, myCards, setStage, dealNewRound, setFinalResults } = useGameStore();

  // On component mount, create a deck and deal cards to players
  useEffect(() => {
    const deck = createDeck();
    const shuffled = shuffleDeck(deck);
    
    // Distribute cards to 4 players (13 each)
    const hands = [
      shuffled.slice(0, 13),
      shuffled.slice(13, 26),
      shuffled.slice(26, 39),
      shuffled.slice(39, 52),
    ];
    dealNewRound(hands);
  }, [dealNewRound]);

  /**
   * This is the core function that communicates with our backend.
   * @param {object} mySortedHand - { head: [...], middle: [...], tail: [...] }
   */
  const handleSubmit = async (mySortedHand) => {
    setStage(STAGES.SUBMITTED);
    console.log('Submitting my hand:', mySortedHand);

    // 1. Prepare the payload for the backend API
    const payload = players.map(player => {
      if (player.id === 'player1') { // This is us
        return { id: player.id, hands: mySortedHand };
      } else {
        // For computer players, just split their cards naively for now.
        // In a real game, this could be a more complex AI choice.
        return {
          id: player.id,
          hands: {
            head: player.cards.slice(0, 3),
            middle: player.cards.slice(3, 8),
            tail: player.cards.slice(8, 13),
          },
        };
      }
    });

    console.log('Sending to backend:', JSON.stringify(payload, null, 2));

    try {
      // 2. Call the backend API
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
      console.log('Received results from backend:', results);
      
      // 3. Update the central store with the authoritative results
      setFinalResults(results);

    } catch (error) {
      console.error('Error submitting hand:', error);
      // Optional: Revert stage to 'PLAYING' to allow user to try again
      setStage(STAGES.PLAYING); 
    }
  };

  const handlePlayAgain = () => {
    // Simply dealing a new round will reset the game state via the store's logic
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

  return (
    <div className="play-container">
      <div className="game-wrapper">
        <div className="game-header">
          <button className="btn-quit" onClick={() => navigate('/')}>
            &lt; 退出房间
          </button>
          <div className="game-stage-display">
            {stage.toUpperCase()}
          </div>
        </div>

        <GameBoard players={players} status={stage} />

        {stage !== STAGES.FINISHED && (
          <Hand
            cards={myCards}
            onSubmit={handleSubmit}
            gameStatus={stage}
          />
        )}
        
        {stage === STAGES.FINISHED && (
            <div className="actions-area">
                <button className="btn-action btn-primary" onClick={handlePlayAgain}>
                    再来一局
                </button>
            </div>
        )}

      </div>
    </div>
  );
}
