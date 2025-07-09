<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://gewe.dpdns.org');
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once '../db.php';

function getDeck() {
    $ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
    $suits = ['♠','♥','♦','♣'];
    $deck = [];
    foreach ($ranks as $r) {
        foreach ($suits as $s) {
            $deck[] = $r.$s;
        }
    }
    return $deck;
}

$room_id = $_POST['room_id'] ?? '';
if (!$room_id) {
    echo json_encode(['error' => '缺少房间号']);
    exit;
}

$res = mysqli_query($conn, "SELECT * FROM players WHERE room_id='$room_id' ORDER BY player_idx ASC");
$players = [];
while ($row = mysqli_fetch_assoc($res)) {
    $players[] = $row['player_idx'];
}
$player_count = count($players);

if ($player_count == 0) {
    echo json_encode(['error' => '房间没有玩家']);
    exit;
}

// 洗牌并发牌
$deck = getDeck();
shuffle($deck);
$hands = [];
for ($i = 0; $i < $player_count; $i++) {
    $hands[$i] = array_splice($deck, 0, 13);
    // 更新数据库每位玩家手牌
    $h = mysqli_real_escape_string($conn, json_encode($hands[$i]));
    mysqli_query($conn, "UPDATE players SET hand='$h' WHERE room_id='$room_id' AND player_idx=$i");
}

// 更新房间状态
mysqli_query($conn, "UPDATE rooms SET status='playing' WHERE room_id='$room_id'");

echo json_encode(['success' => true, 'hands' => $hands]);
exit;
