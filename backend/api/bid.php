<?php
// backend/api/bid.php
// 描述: 处理斗地主游戏的叫地主（叫分）逻辑。

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once '../db.php';
require_once '../utils/response.php';

$input = json_decode(file_get_contents('php://input'), true);

// --- 输入验证 ---
$roomId = $input['roomId'] ?? null;
$userId = $input['userId'] ?? null;
// bid_value: 0 for "pass", 1, 2, 3 for bidding
$bidValue = isset($input['bid_value']) ? (int)$input['bid_value'] : null;

if (!$roomId || !$userId || $bidValue === null) {
    sendErrorResponse('操作失败: 必须提供 roomId, userId 和 bid_value。', 400);
}
if (!in_array($bidValue, [0, 1, 2, 3])) {
    sendErrorResponse('操作失败: 无效的叫分值。', 400);
}

$conn = getDbConnection();
$conn->begin_transaction();

try {
    // 步骤 1: 获取房间和所有玩家的当前状态，并锁定房间以防竞态条件
    $stmt = $conn->prepare("SELECT status, extra_data FROM rooms WHERE room_id = ? AND game_type = 'doudizhu' FOR UPDATE");
    if (!$stmt) throw new Exception("准备查询房间语句失败");
    $stmt->bind_param("s", $roomId);
    $stmt->execute();
    $roomResult = $stmt->get_result();

    if ($roomResult->num_rows === 0) {
        sendErrorResponse("操作失败: 房间不存在或不是斗地主游戏。", 404);
    }
    $room = $roomResult->fetch_assoc();
    $stmt->close();

    if ($room['status'] !== 'bidding') {
        sendErrorResponse("操作失败: 当前不处于叫分阶段。", 403);
    }

    $biddingState = json_decode($room['extra_data'] ?? '[]', true);
    $landlordCards = $biddingState['landlordCards'] ?? []; // 底牌应该在 extra_data 中

    // 初始化叫分状态 (如果第一次叫分)
    if (empty($biddingState['bids'])) {
        $players_stmt = $conn->prepare("SELECT user_id FROM players WHERE room_id = ? ORDER BY joined_at ASC");
        $players_stmt->bind_param("s", $roomId);
        $players_stmt->execute();
        $playersResult = $players_stmt->get_result();
        $playerIds = [];
        while($row = $playersResult->fetch_assoc()) { $playerIds[] = $row['user_id']; }
        $players_stmt->close();

        $biddingState['playerIds'] = $playerIds;
        $biddingState['bids'] = []; // 存储每个玩家的叫分记录
        $biddingState['turnIndex'] = 0; // 从第一个加入的玩家开始
        $biddingState['highestBid'] = 0;
        $biddingState['highestBidder'] = null;
    }

    // 步骤 2: 验证操作合法性
    $turnIndex = $biddingState['turnIndex'];
    $playerIds = $biddingState['playerIds'];
    if ($playerIds[$turnIndex] !== $userId) {
        sendErrorResponse("操作失败: 还未轮到您叫分。", 403);
    }
    if ($bidValue !== 0 && $bidValue <= $biddingState['highestBid']) {
        sendErrorResponse("操作失败: 叫分必须高于当前最高分。", 403);
    }

    // 步骤 3: 更新叫分状态
    $biddingState['bids'][] = ['playerId' => $userId, 'bid' => $bidValue];
    if ($bidValue > 0) {
        $biddingState['highestBid'] = $bidValue;
        $biddingState['highestBidder'] = $userId;
    }
    
    $landlord = null;

    // 步骤 4: 判断叫分是否结束
    // a) 有人叫了3分
    if ($bidValue === 3) {
        $landlord = $userId;
    } else {
        // b) 轮转一圈，确定地主
        $biddingState['turnIndex'] = ($turnIndex + 1) % 3;
        
        // 检查是否所有人都已操作
        $bidsSoFar = count($biddingState['bids']);
        if ($bidsSoFar >= 3) {
            // 如果连续两个玩家pass，则最后一个叫分的玩家是地主
            if (count(array_filter($biddingState['bids'], fn($b) => $b['bid'] > 0)) === 1 && count(array_filter($biddingState['bids'], fn($b) => $b['bid'] === 0)) === 2) {
                 $landlord = $biddingState['highestBidder'];
            }
            // 如果所有人都叫过一次分（并且没人叫3分），最后一个叫分的人是地主
            $lastBids = array_slice($biddingState['bids'], -3);
            if(count($lastBids) === 3 && $biddingState['highestBidder'] !== null) {
                $landlord = $biddingState['highestBidder'];
            }
        }
        // c) 如果所有人都选择不叫，需要重新发牌 (这个逻辑暂时简化，直接报错)
        if ($bidsSoFar === 3 && $biddingState['highestBidder'] === null) {
             // 在真实游戏中，应该重置房间状态为 full 并重新发牌
             sendErrorResponse("所有玩家都不叫，游戏流局。", 409);
        }
    }

    // 步骤 5: 如果确定了地主，结束叫分阶段
    if ($landlord) {
        // a) 更新地主手牌
        $stmt = $conn->prepare("SELECT hand FROM players WHERE room_id = ? AND user_id = ?");
        $stmt->bind_param("ss", $roomId, $landlord);
        $stmt->execute();
        $playerHand = json_decode($stmt->get_result()->fetch_assoc()['hand'], true);
        $stmt->close();
        
        $newHand = array_merge($playerHand, $landlordCards);
        
        $stmt = $conn->prepare("UPDATE players SET hand = ?, status = 'landlord' WHERE room_id = ? AND user_id = ?");
        $stmt->bind_param("sss", json_encode($newHand), $roomId, $landlord);
        $stmt->execute();
        $stmt->close();
        
        // b) 更新其他玩家状态为 "peasant" (农民)
        $stmt = $conn->prepare("UPDATE players SET status = 'peasant' WHERE room_id = ? AND user_id != ?");
        $stmt->bind_param("ss", $roomId, $landlord);
        $stmt->execute();
        $stmt->close();
        
        // c) 更新房间状态为 "playing"，并在extra_data中记录地主和底牌
        $finalRoomData = json_encode(['landlord' => $landlord, 'landlordCards' => $landlordCards]);
        $stmt = $conn->prepare("UPDATE rooms SET status = 'playing', extra_data = ? WHERE room_id = ?");
        $stmt->bind_param("ss", $finalRoomData, $roomId);
        $stmt->execute();
        $stmt->close();
        
    } else {
        // 如果叫分未结束，仅更新biddingState
        $stmt = $conn->prepare("UPDATE rooms SET extra_data = ? WHERE room_id = ?");
        $stmt->bind_param("ss", json_encode($biddingState), $roomId);
        $stmt->execute();
        $stmt->close();
    }

    $conn->commit();
    sendSuccessResponse([
        'bidder' => $userId, 
        'bidValue' => $bidValue,
        'landlordDetermined' => !is_null($landlord),
        'landlord' => $landlord,
        'nextTurnPlayer' => $landlord ? null : $playerIds[$biddingState['turnIndex']]
    ], "叫分成功！");

} catch (Exception $e) {
    $conn->rollback();
    error_log("叫分失败: " . $e->getMessage());
    sendErrorResponse("叫分时发生内部错误。", 500);
} finally {
    closeDbConnection($conn);
}
