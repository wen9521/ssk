<?php
// backend/api/join-room.php
// 描述: 允许一个玩家加入一个已经存在的、等待中的游戏房间。

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once '../db.php';
require_once '../utils/response.php';

$input = json_decode(file_get_contents('php://input'), true);

if (empty($input['roomId']) || empty($input['userId'])) {
    sendErrorResponse('加入失败: 必须提供房间ID (roomId) 和用户ID (userId)。', 400);
}
$roomId = $input['roomId'];
$userId = $input['userId'];

$conn = getDbConnection();
$conn->begin_transaction();

try {
    // 步骤 1: 锁定并检查房间状态和游戏类型
    $stmt = $conn->prepare("SELECT status, game_type FROM rooms WHERE room_id = ? FOR UPDATE");
    if (!$stmt) throw new Exception("准备查询房间语句失败: " . $conn->error);
    $stmt->bind_param("s", $roomId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        sendErrorResponse("加入失败: 房间 {$roomId} 不存在。", 404);
    }
    
    $room = $result->fetch_assoc();
    if ($room['status'] !== 'waiting') {
        sendErrorResponse("加入失败: 房间 {$roomId} 不再接受新玩家。", 403);
    }
    $stmt->close();
    
    // --- 根据游戏类型确定最大玩家数 ---
    $maxPlayers = 4; // 默认
    if ($room['game_type'] === 'doudizhu') {
        $maxPlayers = 3;
    }

    // 步骤 2: 检查房间内的当前玩家数量
    $stmt = $conn->prepare("SELECT COUNT(*) as playerCount, GROUP_CONCAT(user_id) as players FROM players WHERE room_id = ?");
    if (!$stmt) throw new Exception("准备查询玩家数量语句失败: " . $conn->error);
    $stmt->bind_param("s", $roomId);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    $playerCount = (int)$result['playerCount'];
    $players = $result['players'] ? explode(',', $result['players']) : [];
    
    if (in_array($userId, $players)) {
        sendErrorResponse("您已在该房间中。", 409);
    }

    if ($playerCount >= $maxPlayers) {
        sendErrorResponse("加入失败: 房间 {$roomId} 已满。", 403);
    }
    $stmt->close();
    
    // 步骤 3: 插入新玩家
    $stmt = $conn->prepare("INSERT INTO players (room_id, user_id) VALUES (?, ?)");
    if (!$stmt) throw new Exception("准备插入新玩家语句失败: " . $conn->error);
    $stmt->bind_param("ss", $roomId, $userId);
    $stmt->execute();
    $stmt->close();
    
    $newPlayerCount = $playerCount + 1;
    
    // 步骤 4: 如果房间满了，更新房间状态
    if ($newPlayerCount === $maxPlayers) {
        $stmt_update = $conn->prepare("UPDATE rooms SET status = 'full' WHERE room_id = ?");
        if (!$stmt_update) throw new Exception("准备更新房间状态语句失败: " . $conn->error);
        $stmt_update->bind_param("s", $roomId);
        $stmt_update->execute();
        $stmt_update->close();
    }

    $conn->commit();
    
    sendSuccessResponse(['roomId' => $roomId, 'userId' => $userId, 'playerCount' => $newPlayerCount], "成功加入房间！");

} catch (Exception $e) {
    $conn->rollback();
    error_log("加入房间失败: " . $e->getMessage());
    sendErrorResponse("加入房间时发生内部错误，请稍后再试。", 500);
} finally {
    closeDbConnection($conn);
}
