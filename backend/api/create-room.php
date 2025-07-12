<?php
// backend/api/create-room.php
// 描述: 创建一个新的游戏房间，并将创建者作为第一个玩家加入。

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../db.php';
require_once '../utils/response.php';

$input = json_decode(file_get_contents('php://input'), true);

// --- 输入验证 ---
$userId = $input['userId'] ?? null;
$gameType = $input['gameType'] ?? 'thirteen_water'; // 默认为 'thirteen_water' 以兼容旧版

if (empty($userId)) {
    sendErrorResponse('创建失败: 未提供用户ID (userId)。', 400);
}

// 验证游戏类型是否合法
$allowedGameTypes = ['thirteen_water', 'doudizhu', 'big_two'];
if (!in_array($gameType, $allowedGameTypes)) {
    sendErrorResponse('创建失败: 无效的游戏类型。', 400);
}

$roomId = bin2hex(random_bytes(4)); // 生成一个8个字符的十六进制ID

$conn = getDbConnection();
$conn->begin_transaction();

try {
    // 步骤 1: 创建新房间，并指定 game_type
    $stmt = $conn->prepare("INSERT INTO rooms (room_id, game_type, status) VALUES (?, ?, 'waiting')");
    if (!$stmt) throw new Exception("服务器内部错误: 准备创建房间语句失败 - " . $conn->error);
    
    $stmt->bind_param("ss", $roomId, $gameType);
    $stmt->execute();
    $stmt->close();

    // 步骤 2: 将创建者作为第一个玩家加入房间
    $stmt = $conn->prepare("INSERT INTO players (room_id, user_id, is_creator) VALUES (?, ?, TRUE)");
    if (!$stmt) throw new Exception("服务器内部错误: 准备添加玩家语句失败 - " . $conn->error);
    $stmt->bind_param("ss", $roomId, $userId);
    $stmt->execute();
    $stmt->close();

    $conn->commit();

    sendSuccessResponse(['roomId' => $roomId, 'creatorId' => $userId, 'gameType' => $gameType], "房间创建成功！", 201);

} catch (Exception $e) {
    $conn->rollback();
    error_log("创建房间失败: " . $e->getMessage());
    sendErrorResponse("创建房间时发生内部错误，请稍后再试。", 500);
} finally {
    closeDbConnection($conn);
}
