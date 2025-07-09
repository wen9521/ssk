<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://gewe.dpdns.org');
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once '../db.php';

$room_id = $_POST['room_id'] ?? '';
if (!$room_id) {
    echo json_encode(['error' => '缺少房间号']);
    exit;
}

// 删除玩家
mysqli_query($conn, "DELETE FROM players WHERE room_id='$room_id'");
// 删除房间
mysqli_query($conn, "DELETE FROM rooms WHERE room_id='$room_id'");

echo json_encode(['success' => true]);
exit;
