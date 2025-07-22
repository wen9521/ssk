<?php
namespace MyApp;

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;

class GameServer implements MessageComponentInterface
{
    protected $clients;
    protected $players = [];
    protected $gameState = [
        'status' => 'waiting', // waiting, dealing, playing, finished
        'deck' => [],
        'hands' => [],
        'scores' => [],
        'currentPlayer' => null,
    ];

    public function __construct()
    {
        $this->clients = new \SplObjectStorage;
        echo "GameServer class initialized.
";
    }

    public function onOpen(ConnectionInterface $conn)
    {
        $this->clients->attach($conn);
        $playerId = $conn->resourceId;
        $this->players[$playerId] = $conn;

        echo "New connection! ({$playerId})
";
        $this->broadcastState();
    }

    public function onMessage(ConnectionInterface $from, $msg)
    {
        $playerId = $from->resourceId;
        $data = json_decode($msg, true);

        if (!$data || !isset($data['type'])) {
            echo "Invalid message from {$playerId}: {$msg}
";
            return;
        }

        echo sprintf('Connection %d sending message of type "%s"' . "
", $playerId, $data['type']);

        switch ($data['type']) {
            case 'start_game':
                $this->startGame();
                break;
            case 'submit_hand':
                if (isset($data['hand'])) {
                    $this->processPlayerHand($playerId, $data['hand']);
                }
                break;
            // Add more cases here for other game actions
        }
    }

    public function onClose(ConnectionInterface $conn)
    {
        $playerId = $conn->resourceId;
        $this->clients->detach($conn);
        unset($this->players[$playerId]);
        unset($this->gameState['hands'][$playerId]);
        unset($this->gameState['scores'][$playerId]);

        echo "Connection {$playerId} has disconnected
";
        $this->broadcastState();
    }

    public function onError(ConnectionInterface $conn, \Exception $e)
    {
        echo "An error has occurred: {$e->getMessage()}
";
        $conn->close();
    }

    protected function broadcastState()
    {
        $stateToSend = $this->gameState;
        // Don't send the full deck to clients
        unset($stateToSend['deck']);

        // Add player list
        $stateToSend['players'] = array_keys($this->players);

        $response = json_encode(['type' => 'game_state', 'payload' => $stateToSend]);

        foreach ($this->clients as $client) {
            $client->send($response);
        }
    }

    protected function startGame()
    {
        if ($this->gameState['status'] !== 'waiting' && count($this->players) < 2) {
            // Can't start a game that's already in progress or with less than 2 players
            return;
        }

        echo "Starting a new game...
";
        $this->gameState['status'] = 'dealing';
        $this->initializeDeck();
        $this->dealCards();
        $this->gameState['status'] = 'playing';
        $this->broadcastState();
    }

    protected function initializeDeck()
    {
        $suits = ['C', 'D', 'H', 'S']; // Clubs, Diamonds, Hearts, Spades
        $ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
        $this->gameState['deck'] = [];
        foreach ($suits as $suit) {
            foreach ($ranks as $rank) {
                $this->gameState['deck'][] = $rank . $suit;
            }
        }
        shuffle($this->gameState['deck']);
    }

    protected function dealCards()
    {
        $this->gameState['hands'] = [];
        $playerIds = array_keys($this->players);
        $numPlayers = count($playerIds);
        $cardsPerPlayer = 13;

        for ($i = 0; $i < $cardsPerPlayer; $i++) {
            foreach ($playerIds as $playerId) {
                if (!isset($this->gameState['hands'][$playerId])) {
                    $this->gameState['hands'][$playerId] = [];
                }
                $card = array_pop($this->gameState['deck']);
                if ($card) {
                    $this->gameState['hands'][$playerId][] = $card;
                }
            }
        }
        
        // Send each player their specific hand
        foreach($this->players as $playerId => $conn) {
            $hand = $this->gameState['hands'][$playerId] ?? [];
            $handData = json_encode(['type' => 'player_hand', 'payload' => $hand]);
            $conn->send($handData);
        }
    }

    protected function processPlayerHand($playerId, $hand)
    {
        // Basic validation - more advanced validation is needed
        if (count($hand) !== 13) {
            // Invalid hand, maybe notify the player
            return;
        }
        $this->gameState['hands'][$playerId] = $hand;
        
        // Check if all players have submitted their hands
        if (count($this->gameState['hands']) === count($this->players)) {
            $this->evaluateRound();
        }

        $this->broadcastState();
    }
    
    protected function evaluateRound() {
        // This is a placeholder for the full game logic.
        // For a real game, you would compare each player's three sets of cards (front, middle, back)
        // against every other player's sets and calculate scores.
        
        // For now, we just mark the game as finished and prepare for a new round.
        $this->gameState['status'] = 'finished';
        
        // Example score calculation
        foreach($this->players as $playerId => $conn) {
            if(!isset($this->gameState['scores'][$playerId])) {
                $this->gameState['scores'][$playerId] = 0;
            }
            // Give a random score for demonstration
            $this->gameState['scores'][$playerId] += rand(-10, 10);
        }
        
        echo "Round finished. Calculating scores...
";
        
        $this->broadcastState();
        
        // Reset for the next game after a delay
        // In a real app, you might wait for a "new game" signal from clients
        sleep(10); 
        $this->gameState['status'] = 'waiting';
        $this->gameState['hands'] = [];
        echo "Ready for a new game.
";
        $this->broadcastState();
    }
}
