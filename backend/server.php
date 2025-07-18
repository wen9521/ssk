<?php
// server.php
require dirname(__FILE__) . '/vendor/autoload.php';

use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;
use MyApp\GameServer;

// Use a port that Serv00 allows, for example, 8080 or one assigned to you.
$port = 8080;

$server = IoServer::factory(
    new HttpServer(
        new WsServer(
            new GameServer()
        )
    ),
    $port
);

echo "WebSocket server started on port {$port}\n";
$server->run();
