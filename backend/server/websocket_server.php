<?php
require dirname(__DIR__) . '/vendor/autoload.php';

use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;
use MyApp\GameServer;

// 确保你使用的端口是 Serv00 允许的
$port = 8080; 

$server = IoServer::factory(
    new HttpServer(
        new WsServer(
            new GameServer()
        )
    ),
    $port
);

echo "WebSocket 服务器正在监听端口 {$port}\n";
$server->run();
