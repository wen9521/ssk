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

// 检查房间存在
$res = mysqli_query($conn, "SELECT * FROM rooms WHERE room_id='$room_id'");
if (!$res || mysqli_num_rows($res) == 0) {
    echo json_encode(['error' => '房间不存在']);
    exit;
}

// 获取当前玩家数，分配座位号
$res2 = mysqli_query($conn, "SELECT MAX(player_idx) as max_idx FROM players WHERE room_id='$room_id'");
$row = mysqli_fetch_assoc($res2);
$player_idx = $row && $row['max_idx'] !== null ? intval($row['max_idx']) + 1 : 0;

// 插入玩家
$sql = "INSERT INTO players (room_id, player_idx, hand) VALUES ('$room_id', $player_idx, '[]')";
if (mysqli_query($conn, $sql)) {
    echo json_encode(['player_idx' => $player_idx]);
} else {
    echo json_encode(['error' => '加入房间失败']);
}
exit;
