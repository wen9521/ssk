<?php
namespace MyApp;
use Ratchet\MessageComponent\MessageComponentInterface;
use Ratchet\ConnectionInterface;
use Ratchet\WebSocket\MessageComponentInterface as WsMessageComponentInterface;

class GameServer implements WsMessageComponentInterface {
    protected $clients;
    protected $users = []; // To store user ID -> Connection mapping for direct messaging

    public function __construct() {
        $this->clients = new \SplObjectStorage;
        echo "GameServer started.
";
    }

    public function onOpen(ConnectionInterface $conn) {
        // Store the new connection to send messages to later
        $this->clients->attach($conn);

        // Get query parameters from the WebSocket handshake request
        $queryString = $conn->httpRequest->getUri()->getQuery();
        parse_str($queryString, $queryParams);

        $userId = isset($queryParams['userId']) ? $queryParams['userId'] : null;
        $username = isset($queryParams['username']) ? $queryParams['username'] : 'Guest';

        if ($userId) {
            $conn->userId = $userId;
            $conn->username = $username;
            $this->users[$userId] = $conn;
            echo "New connection! User: {$username} ({$userId}) - ResourceId: {$conn->resourceId}
";
        } else {
            echo "New anonymous connection! (Resource: {$conn->resourceId})
";
            // Optionally, close connection if not authenticated
            // $conn->close();
        }
    }

    public function onMessage(ConnectionInterface $from, $msg) {
        // This is a placeholder for game logic. 
        // Messages should be parsed and handled based on their type (e.g., 'play', 'join_room').
        $numRecv = count($this->clients) - 1;
        echo sprintf('Connection %d (%s) sending message "%s" to %d other connection%s
'
            , $from->resourceId, $from->username ?? 'Guest', $msg, $numRecv, $numRecv == 1 ? '' : 's');

        foreach ($this->clients as $client) {
            if ($from !== $client) {
                // The sender is not the receiver, send to each client connected
                // In a real game, messages would be routed to specific rooms/players
                $client->send($msg);
            }
        }
    }

    public function onClose(ConnectionInterface $conn) {
        // The connection is closed, remove it, as we can no longer send it messages
        $this->clients->detach($conn);
        if (isset($conn->userId)) {
            unset($this->users[$conn->userId]);
            echo "User {$conn->username} ({$conn->userId}) disconnected (Resource: {$conn->resourceId})
";
        } else {
            echo "Connection {$conn->resourceId} has disconnected
";
        }
    }

    public function onError(ConnectionInterface $conn, \Exception $e) {
        echo "An error has occurred: {$e->getMessage()}
";

        $conn->close();
    }
}
