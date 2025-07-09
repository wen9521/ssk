<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://gewe.dpdns.org');
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once '../db.php';

$room_id = $_GET['room_id'] ?? '';
if (!$room_id) {
    echo json_encode(['error' => '缺少房间号']);
    exit;
}

// 房间状态
$room_res = mysqli_query($conn, "SELECT status FROM rooms WHERE room_id='$room_id'");
if (!$room_res || mysqli_num_rows($room_res) == 0) {
    echo json_encode(['error' => '房间不存在']);
    exit;
}
$room = mysqli_fetch_assoc($room_res);

// 玩家、手牌和dun
$players = [];
$res = mysqli_query($conn, "SELECT player_idx, hand, dun FROM players WHERE room_id='$room_id' ORDER BY player_idx ASC");
while ($row = mysqli_fetch_assoc($res)) {
    $hand = json_decode($row['hand'], true);
    if (!is_array($hand)) $hand = [];
    $dun = $row['dun'] ? json_decode($row['dun'], true) : null;
    $players[] = [
        'hand' => $hand,
        'dun' => $dun
    ];
}

echo json_encode([
    'room_id' => $room_id,
    'status' => $room['status'],
    'players' => $players
]);
exit;
