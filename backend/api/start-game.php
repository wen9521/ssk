<?php
// backend/api/start-game.php

header('Content-Type: application/json');
require_once '../db.php';
require_once '../utils/cardUtils.php';

$data = json_decode(file_get_contents('php://input'), true);
$room_id = $data['room_id'] ?? '';
$player_id = $data['player_id'] ?? ''; // 发起请求的玩家

if (empty($room_id) || empty($player_id)) {
    http_response_code(400);
    send_json_response(['success' => false, 'message' => '缺少房间号或玩家ID']);
    exit;
}

$conn->begin_transaction();

try {
    // 1. 验证是否为房主
    $stmt = $conn->prepare("SELECT host_id FROM rooms WHERE room_id = ?");
    $stmt->bind_param("s", $room_id);
    $stmt->execute();
    $room_data = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$room_data || $room_data['host_id'] !== $player_id) {
        throw new Exception("只有房主才能开始游戏");
    }

    // 2. 获取所有玩家
    $stmt_players = $conn->prepare("SELECT player_id FROM players WHERE room_id = ? ORDER BY joined_at ASC");
    $stmt_players->bind_param("s", $room_id);
    $stmt_players->execute();
    $players_result = $stmt_players->get_result();
    $players = [];
    while ($row = $players_result->fetch_assoc()) {
        $players[] = $row['player_id'];
    }
    $stmt_players->close();

    $num_players = count($players);
    if ($num_players < 2) { // 实际游戏至少需要2人
        throw new Exception("至少需要2名玩家才能开始游戏");
    }

    // 3. 发牌
    $hands = deal_hands($num_players);

    // 4. 更新每个玩家的手牌
    $stmt_update = $conn->prepare("UPDATE players SET hand = ?, is_ready = 0, dun = NULL, score = 0 WHERE player_id = ?");
    foreach ($players as $index => $pid) {
        $hand_json = json_encode($hands[$index]);
        $stmt_update->bind_param("ss", $hand_json, $pid);
        $stmt_update->execute();
    }
    $stmt_update->close();

    // 5. 更新房间状态为 'playing'
    $stmt_room_status = $conn->prepare("UPDATE rooms SET status = 'playing' WHERE room_id = ?");
    $stmt_room_status->bind_param("s", $room_id);
    $stmt_room_status->execute();
    $stmt_room_status->close();

    $conn->commit();

    send_json_response(['success' => true, 'message' => '游戏已开始']);

} catch (Exception $e) {
    $conn->rollback();
    http_response_code(403); // Forbidden or Bad Request
    send_json_response(['success' => false, 'message' => $e->getMessage()]);
}

closeDbConnection($conn);
?>
