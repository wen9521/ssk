<?php
// backend/api/get-status.php
// 描述: 获取指定房间的当前状态、游戏类型和玩家列表。

require_once '../db.php';
require_once '../utils/response.php';

setCorsHeaders(); // 调用新的CORS头部设置函数
header("Content-Type: application/json; charset=UTF-8");

$roomId = '';
if (isset($_GET['roomId'])) {
    $roomId = $_GET['roomId'];
} else {
    $input = json_decode(file_get_contents('php://input'), true);
    if (isset($input['roomId'])) {
        $roomId = $input['roomId'];
    }
}

if (empty($roomId)) {
    sendErrorResponse('获取状态失败: 未提供房间ID (roomId)。', 400);
}

$conn = getDbConnection();

try {
    // 步骤 1: 获取房间信息，包含 game_type
    $stmt = $conn->prepare("SELECT room_id, game_type, status, created_at FROM rooms WHERE room_id = ?");
    if (!$stmt) throw new Exception("准备查询房间信息语句失败: " . $conn->error);
    $stmt->bind_param("s", $roomId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        sendErrorResponse("获取状态失败: 房间 {$roomId} 不存在。", 404);
    }
    $roomData = $result->fetch_assoc();
    $stmt->close();

    // 步骤 2: 获取房间内的玩家列表
    $stmt = $conn->prepare("SELECT user_id, is_creator, joined_at, status as player_status FROM players WHERE room_id = ? ORDER BY joined_at ASC");
    if (!$stmt) throw new Exception("准备查询玩家列表语句失败: " . $conn->error);
    $stmt->bind_param("s", $roomId);
    $stmt->execute();
    $playersResult = $stmt->get_result();
    $players = [];
    while ($player = $playersResult->fetch_assoc()) {
        $player['is_creator'] = (bool)$player['is_creator'];
        $players[] = $player;
    }
    $stmt->close();
    
    $statusData = [
        'room' => $roomData,
        'players' => $players,
        'playerCount' => count($players)
    ];

    sendSuccessResponse($statusData, "状态获取成功");

} catch (Exception $e) {
    error_log("获取状态失败: " . $e->getMessage());
    sendErrorResponse("获取状态时发生内部错误，请稍后再试。", 500);
} finally {
    closeDbConnection($conn);
}
