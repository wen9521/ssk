<?php
// backend/api/start-game.php
// 描述: 由房主发起，根据游戏类型开始游戏。负责洗牌、发牌，并更新游戏状态。

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once '../db.php';
require_once '../utils/response.php';
require_once '../utils/cardUtils.php';       // 十三水/锄大地工具
require_once '../utils/DoudizhuCardUtils.php'; // 斗地主工具

$input = json_decode(file_get_contents('php://input'), true);

if (empty($input['roomId']) || empty($input['userId'])) {
    sendErrorResponse('操作失败: 必须提供房间ID (roomId) 和用户ID (userId)。', 400);
}
$roomId = $input['roomId'];
$operatorId = $input['userId'];

$conn = getDbConnection();
$conn->begin_transaction();

try {
    // 步骤 1: 验证房间、操作者身份和游戏类型
    $stmt = $conn->prepare("
        SELECT r.status, r.game_type, p.user_id 
        FROM rooms r 
        JOIN players p ON r.room_id = p.room_id 
        WHERE r.room_id = ? AND p.is_creator = TRUE
    ");
    if (!$stmt) throw new Exception("准备验证房主语句失败: " . $conn->error);
    $stmt->bind_param("s", $roomId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        sendErrorResponse("操作失败: 房间不存在或您不是房主。", 404);
    }
    
    $roomInfo = $result->fetch_assoc();
    if ($roomInfo['user_id'] !== $operatorId) {
        sendErrorResponse("操作失败: 只有房主才能开始游戏。", 403);
    }
    if ($roomInfo['status'] !== 'full') {
        sendErrorResponse("操作失败: 房间尚未满员。", 403);
    }
    $gameType = $roomInfo['game_type'];
    $stmt->close();

    // 步骤 2: 获取所有玩家ID
    $stmt = $conn->prepare("SELECT user_id FROM players WHERE room_id = ?");
    if (!$stmt) throw new Exception("准备获取玩家列表语句失败: " . $conn->error);
    $stmt->bind_param("s", $roomId);
    $stmt->execute();
    $result = $stmt->get_result();
    $playerIds = [];
    while($row = $result->fetch_assoc()) {
        $playerIds[] = $row['user_id'];
    }
    $stmt->close();
    
    // 步骤 3: 根据游戏类型进行不同的发牌和处理
    $nextRoomStatus = 'playing'; // 默认的下一个状态
    
    if ($gameType === 'thirteen_water' || $gameType === 'big_two') {
        $hands = dealCardsForPlayers($playerIds);
        $update_hand_stmt = $conn->prepare("UPDATE players SET hand = ? WHERE room_id = ? AND user_id = ?");
        foreach ($hands as $playerId => $hand) {
            $update_hand_stmt->bind_param("sss", json_encode($hand), $roomId, $playerId);
            $update_hand_stmt->execute();
        }
        $update_hand_stmt->close();

    } elseif ($gameType === 'doudizhu') {
        $dealResult = dealCardsForDoudizhu($playerIds);
        $hands = $dealResult['hands'];
        $landlordCards = $dealResult['landlordCards'];
        
        // 更新玩家手牌
        $update_hand_stmt = $conn->prepare("UPDATE players SET hand = ? WHERE room_id = ? AND user_id = ?");
        foreach ($hands as $playerId => $hand) {
            $update_hand_stmt->bind_param("sss", json_encode($hand), $roomId, $playerId);
            $update_hand_stmt->execute();
        }
        $update_hand_stmt->close();

        // 将底牌存储在房间的某个字段，这里我们暂时借用/新增一个 'extra_data' 字段
        // 注意：需要先去 init_db.php 给 rooms 表添加一个 extra_data TEXT 字段
        $stmt_update_room_extra = $conn->prepare("UPDATE rooms SET extra_data = ? WHERE room_id = ?");
        if (!$stmt_update_room_extra) throw new Exception("准备更新底牌语句失败: " . $conn->error);
        $stmt_update_room_extra->bind_param("ss", json_encode($landlordCards), $roomId);
        $stmt_update_room_extra->execute();
        $stmt_update_room_extra->close();
        
        // 斗地主发完牌后进入叫地主(bidding)阶段
        $nextRoomStatus = 'bidding'; 
    } else {
        throw new Exception("未知的游戏类型: {$gameType}");
    }

    // 步骤 4: 更新房间状态
    $stmt_update_room = $conn->prepare("UPDATE rooms SET status = ? WHERE room_id = ?");
    if (!$stmt_update_room) throw new Exception("准备更新房间状态语句失败: " . $conn->error);
    $stmt_update_room->bind_param("ss", $nextRoomStatus, $roomId);
    $stmt_update_room->execute();
    $stmt_update_room->close();

    $conn->commit();
    sendSuccessResponse(['roomId' => $roomId, 'gameType' => $gameType, 'status' => $nextRoomStatus], "游戏开始！");

} catch (Exception $e) {
    $conn->rollback();
    error_log("开始游戏失败: " . $e->getMessage());
    sendErrorResponse("开始游戏时发生内部错误: " . $e->getMessage(), 500);
} finally {
    closeDbConnection($conn);
}
