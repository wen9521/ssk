<?php
// backend/api/create-room.php

header('Content-Type: application/json');
require_once '../db.php';

// 生成一个随机且易于记忆的房间号 (5位大写字母)
function generate_room_id($conn) {
    do {
        $room_id = '';
        $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for ($i = 0; $i < 5; $i++) {
            $room_id .= $chars[rand(0, strlen($chars) - 1)];
        }
        // 检查房间号是否已存在
        $stmt = $conn->prepare("SELECT id FROM rooms WHERE room_id = ?");
        $stmt->bind_param("s", $room_id);
        $stmt->execute();
        $result = $stmt->get_result();
    } while ($result->num_rows > 0);
    $stmt->close();
    return $room_id;
}

// 获取前端发送的数据
$data = json_decode(file_get_contents('php://input'), true);
$playerName = $data['name'] ?? '房主';
$playerId = uniqid('player_', true); // 为新玩家生成唯一ID

// 开启事务, 确保数据一致性
$conn->begin_transaction();

try {
    // 1. 创建房间
    $room_id = generate_room_id($conn);
    $stmt_room = $conn->prepare("INSERT INTO rooms (room_id, host_id) VALUES (?, ?)");
    $stmt_room->bind_param("ss", $room_id, $playerId);
    $stmt_room->execute();
    $stmt_room->close();
    
    // 2. 将创建者作为房主加入玩家表
    $stmt_player = $conn->prepare("INSERT INTO players (player_id, room_id, name, is_host) VALUES (?, ?, ?, 1)");
    $stmt_player->bind_param("sss", $playerId, $room_id, $playerName);
    $stmt_player->execute();
    $stmt_player->close();
    
    // 提交事务
    $conn->commit();
    
    // 返回成功响应
    send_json_response([
        'success' => true,
        'room_id' => $room_id,
        'player_id' => $playerId,
        'player_name' => $playerName
    ]);
    
} catch (mysqli_sql_exception $e) {
    // 如果出错, 回滚事务
    $conn->rollback();
    http_response_code(500);
    send_json_response([
        'success' => false,
        'message' => '创建房间失败: ' . $e->getMessage()
    ]);
}

closeDbConnection($conn);
?>
