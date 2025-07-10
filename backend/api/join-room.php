<?php
// backend/api/join-room.php

header('Content-Type: application/json');
require_once '../db.php';

$data = json_decode(file_get_contents('php://input'), true);
$room_id = strtoupper($data['room_id'] ?? '');
$player_name = $data['name'] ?? '玩家';

if (empty($room_id)) {
    http_response_code(400);
    send_json_response(['success' => false, 'message' => '房间号不能为空']);
    exit;
}

// 开启事务
$conn->begin_transaction();

try {
    // 1. 检查房间是否存在并锁定, 防止并发问题
    $stmt = $conn->prepare("SELECT id FROM rooms WHERE room_id = ? FOR UPDATE");
    $stmt->bind_param("s", $room_id);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows === 0) {
        throw new Exception("房间不存在");
    }
    $stmt->close();
    
    // 2. 检查房间人数
    $stmt = $conn->prepare("SELECT COUNT(id) as player_count FROM players WHERE room_id = ?");
    $stmt->bind_param("s", $room_id);
    $stmt->execute();
    $player_count = $stmt->get_result()->fetch_assoc()['player_count'];
    $stmt->close();
    
    if ($player_count >= 4) {
        throw new Exception("房间已满");
    }
    
    // 3. 添加新玩家
    $player_id = uniqid('player_', true);
    $stmt_player = $conn->prepare("INSERT INTO players (player_id, room_id, name) VALUES (?, ?, ?)");
    $stmt_player->bind_param("sss", $player_id, $room_id, $player_name);
    $stmt_player->execute();
    $stmt_player->close();
    
    // 提交事务
    $conn->commit();
    
    send_json_response([
        'success' => true,
        'room_id' => $room_id,
        'player_id' => $player_id,
        'player_name' => $player_name
    ]);
    
} catch (Exception $e) {
    $conn->rollback();
    http_response_code(400); // Bad Request
    send_json_response([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

closeDbConnection($conn);
?>
