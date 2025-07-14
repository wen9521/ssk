<?php
// backend/api/set-dun.php
// 描述: 玩家提交自己整理好的三墩牌。

require_once '../utils/cors.php';
require_once '../db.php';
require_once '../utils/response.php';
// require_once '../utils/scoring.php'; // 未来用于验证牌型和计分

header("Content-Type: application/json; charset=UTF-8");

$input = json_decode(file_get_contents('php://input'), true);

// --- 输入验证 ---
$errors = [];
if (empty($input['roomId'])) $errors[] = 'roomId 不能为空。';
if (empty($input['userId'])) $errors[] = 'userId 不能为空。';
if (empty($input['hands']['front']) || count($input['hands']['front']) !== 3) $errors[] = '前墩牌 (front) 必须是3张。';
if (empty($input['hands']['middle']) || count($input['hands']['middle']) !== 5) $errors[] = '中墩牌 (middle) 必须是5张。';
if (empty($input['hands']['back']) || count($input['hands']['back']) !== 5) $errors[] = '后墩牌 (back) 必须是5张。';

if (!empty($errors)) {
    sendErrorResponse('提交失败: 输入数据无效。', 400, $errors);
}

$roomId = $input['roomId'];
$userId = $input['userId'];
$frontHand = json_encode($input['hands']['front']);
$middleHand = json_encode($input['hands']['middle']);
$backHand = json_encode($input['hands']['back']);

// TODO: 在这里可以引入 scoring.php 中的函数来验证牌型是否合法
// 比如 isValidHand(array_merge($input['hands']['front'], ...), $originalHandFromDb)
// 比如 isCombinationValid($frontHand, $middleHand, $backHand)

$conn = getDbConnection();
$conn->begin_transaction();

try {
    // 步骤 1: 验证玩家和房间状态
    $stmt = $conn->prepare("SELECT p.status FROM players p JOIN rooms r ON p.room_id = r.room_id WHERE p.room_id = ? AND p.user_id = ? AND r.status = 'playing'");
    if (!$stmt) throw new Exception("准备验证玩家状态语句失败: " . $conn->error);
    $stmt->bind_param("ss", $roomId, $userId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        sendErrorResponse("提交失败: 房间不在游戏中或玩家不属于该房间。", 403);
    }
    
    $player = $result->fetch_assoc();
    if ($player['status'] === 'dun_set') {
        sendErrorResponse("您已经提交过牌，请勿重复提交。", 409);
    }
    $stmt->close();
    
    // 步骤 2: 更新玩家的三墩牌和状态
    $stmt = $conn->prepare("UPDATE players SET front_hand = ?, middle_hand = ?, back_hand = ?, status = 'dun_set' WHERE room_id = ? AND user_id = ?");
    if (!$stmt) throw new Exception("准备更新玩家牌组语句失败: " . $conn->error);
    $stmt->bind_param("sssss", $frontHand, $middleHand, $backHand, $roomId, $userId);
    $stmt->execute();
    
    if ($stmt->affected_rows === 0) {
        // 如果没有行被更新，说明出了问题
        throw new Exception("更新玩家牌组失败，没有行受到影响。");
    }
    $stmt->close();
    
    // 步骤 3: 检查是否所有玩家都已完成
    $stmt = $conn->prepare("SELECT COUNT(*) as dunSetCount FROM players WHERE room_id = ? AND status = 'dun_set'");
    if (!$stmt) throw new Exception("准备检查所有玩家状态语句失败: " . $conn->error);
    $stmt->bind_param("s", $roomId);
    $stmt->execute();
    $countResult = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    
    $isAllDunSet = ($countResult['dunSetCount'] === 4);
    
    // 如果所有人都完成了，可以触发计分逻辑 (这里暂时只更新房间状态)
    if ($isAllDunSet) {
        // TODO: 在这里调用计分函数
        
        $stmt_update_room = $conn->prepare("UPDATE rooms SET status = 'scoring' WHERE room_id = ?");
        if (!$stmt_update_room) throw new Exception("准备更新房间状态为 scoring 失败: " . $conn->error);
        $stmt_update_room->bind_param("s", $roomId);
        $stmt_update_room->execute();
        $stmt_update_room->close();
    }
    
    $conn->commit();
    
    $responseData = ['allPlayersReady' => $isAllDunSet];
    sendSuccessResponse($responseData, "牌组提交成功！");
    
} catch (Exception $e) {
    $conn->rollback();
    error_log("提交dun牌失败: " . $e->getMessage());
    sendErrorResponse("提交牌组时发生内部错误。", 500);
} finally {
    closeDbConnection($conn);
}
