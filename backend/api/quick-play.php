<?php
// backend/api/quick-play.php
// 描述: 处理“人机试玩”请求，自动创建房间、填充AI、开始游戏。

require_once '../db.php';
require_once '../utils/response.php';
require_once '../utils/cardUtils.php';
require_once '../utils/DoudizhuCardUtils.php';

setCorsHeaders(); // 调用新的CORS头部设置函数
header("Content-Type: application/json; charset=UTF-8");

$input = json_decode(file_get_contents('php://input'), true);

$userId = $input['userId'] ?? null;
$gameType = $input['gameType'] ?? 'thirteen_water';

if (empty($userId)) sendErrorResponse('操作失败: 未提供用户ID。', 400);

$allowedGameTypes = ['thirteen_water', 'doudizhu', 'big_two'];
if (!in_array($gameType, $allowedGameTypes)) sendErrorResponse('操作失败: 无效的游戏类型。', 400);

$maxPlayers = ($gameType === 'doudizhu') ? 3 : 4;
$roomId = 'trial_' . bin2hex(random_bytes(3)); // 'trial_'前缀以作区分

$conn = getDbConnection();
$conn->begin_transaction();

try {
    // 步骤 1: 创建房间
    $stmt = $conn->prepare("INSERT INTO rooms (room_id, game_type, status) VALUES (?, ?, 'playing')");
    $stmt->bind_param("ss", $roomId, $gameType);
    $stmt->execute();
    $stmt->close();

    // 步骤 2: 创建玩家列表 (真实玩家 + AI)
    $playerIds = [$userId];
    for ($i = 1; $i < $maxPlayers; $i++) {
        $playerIds[] = "ai_player_" . $i;
    }
    
    // 步骤 3: 将所有玩家插入数据库
    $stmt = $conn->prepare("INSERT INTO players (room_id, user_id, is_creator) VALUES (?, ?, ?)");
    foreach($playerIds as $index => $pid) {
        $isCreator = ($index === 0);
        $stmt->bind_param("ssi", $roomId, $pid, $isCreator);
        $stmt->execute();
    }
    $stmt->close();
    
    // 步骤 4: 发牌
    $nextRoomStatus = 'playing';
    if ($gameType === 'thirteen_water' || $gameType === 'big_two') {
        $hands = dealCardsForPlayers($playerIds);
    } elseif ($gameType === 'doudizhu') {
        $dealResult = dealCardsForDoudizhu($playerIds);
        $hands = $dealResult['hands'];
        $landlordCards = $dealResult['landlordCards'];
        
        $biddingState = ['landlordCards' => $landlordCards, 'playerIds' => $playerIds, 'bids' => [], 'turnIndex' => 0, 'highestBid' => 0, 'highestBidder' => null];
        
        $stmt_extra = $conn->prepare("UPDATE rooms SET extra_data = ? WHERE room_id = ?");
        $stmt_extra->bind_param("ss", json_encode($biddingState), $roomId);
        $stmt_extra->execute();
        $stmt_extra->close();
        
        $nextRoomStatus = 'bidding';
    }
    
    // 步骤 5: 更新所有玩家手牌
    $stmt_hand = $conn->prepare("UPDATE players SET hand = ? WHERE room_id = ? AND user_id = ?");
    foreach ($hands as $pid => $hand) {
        $stmt_hand->bind_param("sss", json_encode($hand), $roomId, $pid);
        $stmt_hand->execute();
    }
    $stmt_hand->close();
    
    // 步骤 6: 更新最终房间状态
    $stmt_status = $conn->prepare("UPDATE rooms SET status = ? WHERE room_id = ?");
    $stmt_status->bind_param("ss", $nextRoomStatus, $roomId);
    $stmt_status->execute();
    $stmt_status->close();
    
    $conn->commit();
    sendSuccessResponse(['roomId' => $roomId, 'status' => $nextRoomStatus], "试玩房间创建成功！");

} catch (Exception $e) {
    $conn->rollback();
    error_log("人机试玩创建失败: " . $e->getMessage());
    sendErrorResponse("创建试玩房间时发生内部错误。", 500);
} finally {
    closeDbConnection($conn);
}
