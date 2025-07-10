<?php
// backend/api/set-dun.php

header('Content-Type: application/json');
require_once '../db.php';

$data = json_decode(file_get_contents('php://input'), true);
$player_id = $data['player_id'] ?? '';
$dun = $data['dun'] ?? null; // dun 应该是一个 {head, middle, tail} 结构

if (empty($player_id) || empty($dun)) {
    http_response_code(400);
    send_json_response(['success' => false, 'message' => '缺少 player_id 或 dun 数据']);
    exit;
}

// 验证 dun 结构是否正确 (简单的验证)
if (!isset($dun['head']) || !isset($dun['middle']) || !isset($dun['tail']) || 
    count($dun['head']) !== 3 || count($dun['middle']) !== 5 || count($dun['tail']) !== 5) {
    http_response_code(400);
    send_json_response(['success' => false, 'message' => '牌墩结构不正确，请按 3-5-5 分配']);
    exit;
}

$conn->begin_transaction();

try {
    // 1. 更新玩家的牌墩和准备状态
    $dun_json = json_encode($dun);
    $stmt = $conn->prepare("UPDATE players SET dun = ?, is_ready = 1 WHERE player_id = ?");
    $stmt->bind_param("ss", $dun_json, $player_id);
    $stmt->execute();
    $stmt->close();

    // 2. 获取玩家所在的房间ID
    $stmt_get_room = $conn->prepare("SELECT room_id FROM players WHERE player_id = ?");
    $stmt_get_room->bind_param("s", $player_id);
    $stmt_get_room->execute();
    $room_id = $stmt_get_room->get_result()->fetch_assoc()['room_id'];
    $stmt_get_room->close();

    if (!$room_id) {
        throw new Exception("找不到该玩家所在的房间");
    }

    // 3. 检查是否所有玩家都已准备好
    $stmt_check_all_ready = $conn->prepare("
        SELECT COUNT(*) as total_players, SUM(is_ready) as ready_players 
        FROM players 
        WHERE room_id = ?
    ");
    $stmt_check_all_ready->bind_param("s", $room_id);
    $stmt_check_all_ready->execute();
    $result = $stmt_check_all_ready->get_result()->fetch_assoc();
    $stmt_check_all_ready->close();

    $all_ready = ($result['total_players'] > 0 && $result['total_players'] == $result['ready_players']);

    // 4. 如果所有人都准备好了, 更新房间状态为 comparing
    if ($all_ready) {
        // 在这里可以加入比牌和计分的逻辑, 然后直接把房间状态设为 finished
        // 为简化流程, 我们先只改变状态, 计分逻辑可以放在 get-status 或一个新API中
        $stmt_update_room = $conn->prepare("UPDATE rooms SET status = 'comparing' WHERE room_id = ?");
        $stmt_update_room->bind_param("s", $room_id);
        $stmt_update_room->execute();
        $stmt_update_room->close();
    }

    $conn->commit();

    send_json_response([
        'success' => true,
        'message' => '理牌已提交',
        'all_ready' => $all_ready
    ]);

} catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    send_json_response(['success' => false, 'message' => $e->getMessage()]);
}

closeDbConnection($conn);
?>
