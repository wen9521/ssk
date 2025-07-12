<?php
// backend/api/reset-room.php
// 描述: 由房主操作，用于重置一个房间，清空所有玩家数据，以便重新开始。

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once '../db.php';
require_once '../utils/response.php';

$input = json_decode(file_get_contents('php://input'), true);

// --- 输入验证 ---
if (empty($input['roomId']) || empty($input['userId'])) {
    sendErrorResponse('操作失败: 必须提供房间ID (roomId) 和用户ID (userId)。', 400);
}
$roomId = $input['roomId'];
$operatorId = $input['userId'];

$conn = getDbConnection();
$conn->begin_transaction();

try {
    // 步骤 1: 验证操作者是否为房主
    $stmt = $conn->prepare("SELECT user_id FROM players WHERE room_id = ? AND is_creator = TRUE");
    if (!$stmt) throw new Exception("准备验证房主语句失败: " . $conn->error);
    $stmt->bind_param("s", $roomId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        sendErrorResponse("操作失败: 房间不存在或您没有权限。", 404);
    }
    
    $creator = $result->fetch_assoc();
    if ($creator['user_id'] !== $operatorId) {
        sendErrorResponse("操作失败: 只有房主才能重置房间。", 403);
    }
    $stmt->close();
    
    // 步骤 2: 删除房间内所有玩家的记录
    $stmt = $conn->prepare("DELETE FROM players WHERE room_id = ?");
    if (!$stmt) throw new Exception("准备删除玩家记录语句失败: " . $conn->error);
    $stmt->bind_param("s", $roomId);
    $stmt->execute();
    $stmt->close();
    
    // 步骤 3: 更新房间状态回 'waiting'
    $stmt = $conn->prepare("UPDATE rooms SET status = 'waiting' WHERE room_id = ?");
    if (!$stmt) throw new Exception("准备更新房间状态语句失败: " . $conn->error);
    $stmt->bind_param("s", $roomId);
    $stmt->execute();
    $stmt->close();
    
    // 步骤 4: 将房主重新添加回房间
    $stmt = $conn->prepare("INSERT INTO players (room_id, user_id, is_creator) VALUES (?, ?, TRUE)");
    if (!$stmt) throw new Exception("准备重新添加房主语句失败: " . $conn->error);
    $stmt->bind_param("ss", $roomId, $operatorId);
    $stmt->execute();
    $stmt->close();

    $conn->commit();
    
    sendSuccessResponse(['roomId' => $roomId], "房间已成功重置！");

} catch (Exception $e) {
    $conn->rollback();
    error_log("重置房间失败: " . $e->getMessage());
    sendErrorResponse("重置房间时发生内部错误。", 500);
} finally {
    closeDbConnection($conn);
}
