<?php
// backend/api/get-status.php (v2)

header('Content-Type: application/json');
require_once '../db.php';
require_once '../utils/scoring.php'; // 引入计分工具

$room_id = $_GET['room_id'] ?? '';

if (empty($room_id)) {
    http_response_code(400);
    send_json_response(['success' => false, 'message' => '房间号不能为空']);
    exit;
}

$conn->begin_transaction();

try {
    // --- 步骤 1: 获取房间和玩家的当前状态 ---
    $stmt_room = $conn->prepare("SELECT status FROM rooms WHERE room_id = ? FOR UPDATE");
    $stmt_room->bind_param("s", $room_id);
    $stmt_room->execute();
    $room_result = $stmt_room->get_result();

    if ($room_result->num_rows === 0) {
        throw new Exception("房间不存在");
    }
    $room_data = $room_result->fetch_assoc();
    $current_status = $room_data['status'];
    $stmt_room->close();

    // --- 步骤 2: 核心逻辑 - 如果是比牌阶段, 则执行计分和状态更新 ---
    if ($current_status === 'comparing') {
        // 获取所有玩家的牌墩用于计分
        $stmt_players_for_scoring = $conn->prepare("SELECT player_id, name, dun FROM players WHERE room_id = ? ORDER BY joined_at ASC");
        $stmt_players_for_scoring->bind_param("s", $room_id);
        $stmt_players_for_scoring->execute();
        $players_to_score_result = $stmt_players_for_scoring->get_result();
        
        $players_to_score = [];
        while ($player = $players_to_score_result->fetch_assoc()) {
            $player['dun'] = json_decode($player['dun'], true);
            $players_to_score[] = $player;
        }
        $stmt_players_for_scoring->close();

        // 调用计分函数
        $final_scores = calculate_all_scores($players_to_score);

        // 更新每个玩家的分数
        $stmt_update_score = $conn->prepare("UPDATE players SET score = ? WHERE player_id = ?");
        foreach ($players_to_score as $index => $player) {
            $score = $final_scores[$index];
            $stmt_update_score->bind_param("is", $score, $player['player_id']);
            $stmt_update_score->execute();
        }
        $stmt_update_score->close();

        // 更新房间状态为 'finished'
        $stmt_finish_room = $conn->prepare("UPDATE rooms SET status = 'finished' WHERE room_id = ?");
        $stmt_finish_room->bind_param("s", $room_id);
        $stmt_finish_room->execute();
        $stmt_finish_room->close();
    }

    // --- 步骤 3: 获取并返回最新的游戏状态 (无论是否更新过) ---
    $stmt_room_final = $conn->prepare("SELECT status, game_data, host_id FROM rooms WHERE room_id = ?");
    $stmt_room_final->bind_param("s", $room_id);
    $stmt_room_final->execute();
    $room_final_data = $stmt_room_final->get_result()->fetch_assoc();
    $room_final_data['game_data'] = $room_final_data['game_data'] ? json_decode($room_final_data['game_data'], true) : null;
    $stmt_room_final->close();

    $stmt_players_final = $conn->prepare("SELECT player_id, name, hand, dun, score, is_ready, is_host FROM players WHERE room_id = ? ORDER BY joined_at ASC");
    $stmt_players_final->bind_param("s", $room_id);
    $stmt_players_final->execute();
    $players_final_result = $stmt_players_final->get_result();
    
    $players = [];
    while ($player = $players_final_result->fetch_assoc()) {
        $player['hand'] = $player['hand'] ? json_decode($player['hand'], true) : null;
        $player['dun'] = $player['dun'] ? json_decode($player['dun'], true) : null;
        $players[] = $player;
    }
    $stmt_players_final->close();
    
    $conn->commit();

    send_json_response([
        'success' => true,
        'game_state' => [
            'room_info' => [
                'room_id' => $room_id,
                'status' => $room_final_data['status'],
                'host_id' => $room_final_data['host_id']
            ],
            'game_data' => $room_final_data['game_data'],
            'players' => $players
        ]
    ]);

} catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    send_json_response(['success' => false, 'message' => '获取状态失败: ' . $e->getMessage()]);
}

closeDbConnection($conn);
?>
