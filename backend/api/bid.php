<?php
// backend/api/bid.php
// 描述: 处理斗地主游戏的叫地主（叫分）逻辑。

require_once '../db.php';
require_once '../utils/response.php';
require_once '../utils/DoudizhuCardUtils.php'; // 引入卡牌工具

setCorsHeaders(); // 调用新的CORS头部设置函数
header("Content-Type: application/json; charset=UTF-8");

$input = json_decode(file_get_contents('php://input'), true);

// --- 输入验证 ---
$roomId = $input['roomId'] ?? null;
$userId = $input['userId'] ?? null;
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
    // 步骤 1: 获取并锁定房间状态
    $stmt = $conn->prepare("SELECT status, extra_data FROM rooms WHERE room_id = ? AND game_type = 'doudizhu' FOR UPDATE");
    $stmt->bind_param("s", $roomId);
    $stmt->execute();
    $roomResult = $stmt->get_result();
    if ($roomResult->num_rows === 0) throw new Exception("房间不存在或不是斗地主游戏。", 404);
    $room = $roomResult->fetch_assoc();
    $stmt->close();

    if ($room['status'] !== 'bidding') {
        sendErrorResponse("操作失败: 当前不处于叫分阶段。", 403);
    }

    $biddingState = json_decode($room['extra_data'] ?? '[]', true);
    $playerIds = $biddingState['playerIds'] ?? [];

    // 如果playerIds为空，从players表重新获取
    if (empty($playerIds)) {
        $players_stmt = $conn->prepare("SELECT user_id FROM players WHERE room_id = ? ORDER BY joined_at ASC");
        $players_stmt->bind_param("s", $roomId);
        $players_stmt->execute();
        $playersResult = $players_stmt->get_result();
        while($row = $playersResult->fetch_assoc()) { $playerIds[] = $row['user_id']; }
        $players_stmt->close();
        if(count($playerIds) !== 3) throw new Exception("玩家人数不为3");
        $biddingState['playerIds'] = $playerIds;
    }

    // 初始化叫分状态
    if (empty($biddingState['bids'])) {
        $biddingState['bids'] = [];
        $biddingState['turnIndex'] = 0;
        $biddingState['highestBid'] = 0;
        $biddingState['highestBidder'] = null;
    }

    // 步骤 2: 验证操作合法性
    $turnIndex = $biddingState['turnIndex'];
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
    $biddingState['turnIndex'] = ($turnIndex + 1) % 3; // 先递增

    // 步骤 4: 判断叫分是否结束
    // a) 有人叫了3分
    if ($bidValue === 3) {
        $landlord = $userId;
    } else {
        // b) 所有人都已操作
        $bidsSoFar = count($biddingState['bids']);
        if ($bidsSoFar >= 3) {
            // 检查最近的三个出价，如果两个是 pass，则最高出价者成为地主
            $lastThreeBids = array_slice($biddingState['bids'], -3);
            $passCount = count(array_filter($lastThreeBids, fn($b) => $b['bid'] === 0));

            if ($biddingState['highestBidder'] !== null) {
                // 如果有人叫了分，并且在他之后连续两人不叫，他就当地主
                $lastBidderIndex = -1;
                foreach($biddingState['bids'] as $index => $bid) {
                    if ($bid['playerId'] === $biddingState['highestBidder']) $lastBidderIndex = $index;
                }
                if ($bidsSoFar - 1 - $lastBidderIndex >= 2) {
                     $landlord = $biddingState['highestBidder'];
                }
            }
             // 或者轮完一圈还没定，那就按最高分来
            if(!$landlord && $bidsSoFar % 3 === 0 && $biddingState['highestBidder'] !== null) {
                 $landlord = $biddingState['highestBidder'];
            }
        }
        
        // c) 如果所有人都选择不叫 ("流局")
        if ($bidsSoFar >= 3 && $biddingState['highestBidder'] === null) {
            // --- 关键修复：实现流局重置逻辑 ---
            $cardUtils = new DoudizhuCardUtils();
            $cardUtils->shuffle();
            $hands = $cardUtils->deal();
            
            // 更新每个玩家的手牌
            for ($i = 0; $i < 3; $i++) {
                $stmt = $conn->prepare("UPDATE players SET hand = ? WHERE room_id = ? AND user_id = ?");
                $stmt->bind_param("sss", json_encode($hands[$i]), $roomId, $playerIds[$i]);
                $stmt->execute();
                $stmt->close();
            }

            // 重置房间的extra_data，开始新一轮叫分
            $newBiddingState = [
                'playerIds' => $playerIds,
                'landlordCards' => $hands[3], // 新的底牌
                'bids' => [],
                'turnIndex' => ($biddingState['turnIndex']) % 3, // 从下家开始
                'highestBid' => 0,
                'highestBidder' => null
            ];
            $stmt = $conn->prepare("UPDATE rooms SET extra_data = ? WHERE room_id = ?");
            $stmt->bind_param("ss", json_encode($newBiddingState), $roomId);
            $stmt->execute();
            $stmt->close();

            $conn->commit();
            sendSuccessResponse(['redeal' => true], "所有玩家都不叫，流局并重新发牌。");
            return; // 修复完成，直接返回
        }
    }

    // 步骤 5: 如果确定了地主，结束叫分阶段
    if ($landlord) {
        $landlordCards = $biddingState['landlordCards'];
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
        
        // b) 更新农民状态
        $stmt = $conn->prepare("UPDATE players SET status = 'peasant' WHERE room_id = ? AND user_id != ?");
        $stmt->bind_param("ss", $roomId, $landlord);
        $stmt->execute();
        $stmt->close();
        
        // c) 更新房间状态
        $finalRoomData = json_encode(['landlord' => $landlord, 'landlordCards' => $landlordCards, 'turn' => $landlord]);
        $stmt = $conn->prepare("UPDATE rooms SET status = 'playing', extra_data = ? WHERE room_id = ?");
        $stmt->bind_param("ss", $finalRoomData, $roomId);
        $stmt->execute();
        $stmt->close();
        
        $conn->commit();
        sendSuccessResponse(['landlordDetermined' => true, 'landlord' => $landlord], "地主已确定！");
    } else {
        // 叫分未结束，仅更新biddingState
        $stmt = $conn->prepare("UPDATE rooms SET extra_data = ? WHERE room_id = ?");
        $stmt->bind_param("ss", json_encode($biddingState), $roomId);
        $stmt->execute();
        $stmt->close();
        
        $conn->commit();
        sendSuccessResponse([
            'bidder' => $userId, 
            'bidValue' => $bidValue,
            'landlordDetermined' => false,
            'nextTurnPlayer' => $playerIds[$biddingState['turnIndex']]
        ], "叫分成功！");
    }

} catch (Exception $e) {
    $conn->rollback();
    error_log("叫分失败 [Room: $roomId, User: $userId]: " . $e->getMessage());
    sendErrorResponse("叫分时发生内部错误: " . $e->getMessage(), 500);
} finally {
    if (isset($conn)) {
        closeDbConnection($conn);
    }
}
