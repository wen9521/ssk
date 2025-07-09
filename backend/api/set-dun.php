<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://gewe.dpdns.org');
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once '../db.php';

$room_id = $_POST['room_id'] ?? '';
$player_idx = $_POST['player_idx'] ?? '';
$dun = $_POST['dun'] ?? '';

if (!$room_id || $player_idx === '' || !$dun) {
    echo json_encode(['error' => '参数不完整']);
    exit;
}
$dun = mysqli_real_escape_string($conn, $dun);

$sql = "UPDATE players SET dun='$dun' WHERE room_id='$room_id' AND player_idx=$player_idx";
if (mysqli_query($conn, $sql)) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['error' => '理牌失败']);
}
exit;
