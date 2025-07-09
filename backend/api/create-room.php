<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://gewe.dpdns.org');
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once '../db.php';

$room_id = uniqid("room_");
$sql = "INSERT INTO rooms (room_id) VALUES ('$room_id')";
if (mysqli_query($conn, $sql)) {
    echo json_encode(['room_id' => $room_id]);
} else {
    echo json_encode(['error' => '房间创建失败']);
}
exit;
