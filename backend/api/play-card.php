<?php
// backend/api/play-card.php
// 描述: 处理玩家的出牌请求，包含完整的游戏逻辑。

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once '../db.php';
require_once '../utils/response.php';
require_once '../utils/DoudizhuRule.php';
require_once '../utils/BigTwoRule.php'; // 引入锄大地规则

$input = json_decode(file_get_contents('php://input'), true);

$roomId = $input['roomId'] ?? null;
$userId = $input['userId'] ?? null;
$playedCards = $input['cards'] ?? [];

if (!$roomId || !$userId) sendErrorResponse('操作失败: 缺少 roomId 或 userId。', 400);

$conn = getDbConnection();
$conn->begin_transaction();

try {
    // 1. 获取游戏和玩家状态
    $stmt = $conn->prepare("SELECT game_type, status, extra_data FROM rooms WHERE room_id = ? FOR UPDATE");
    $stmt->bind_param("s", $roomId);
    $stmt->execute();
    $room = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$room || $room['status'] !== 'playing') sendErrorResponse('操作失败: 游戏不在进行中。', 403);

    $stmt = $conn->prepare("SELECT hand FROM players WHERE room_id = ? AND user_id = ?");
    $stmt->bind_param("ss", $roomId, $userId);
    $stmt->execute();
    $player = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    $playerHand = json_decode($player['hand'], true);

    $gameState = json_decode($room['extra_data'] ?? '{}', true);
    
    // 初始化/验证回合
    if (!isset($gameState['turn'])) {
        // 找出谁有方块3，谁就先出牌
        $stmt_p = $conn->prepare("SELECT user_id, hand FROM players WHERE room_id = ?");
        $stmt_p->bind_param("s", $roomId);
        $stmt_p->execute();
        $players_res = $stmt_p->get_result();
        $playerOrder = [];
        while($p_row = $players_res->fetch_assoc()) {
            $playerOrder[] = $p_row['user_id'];
            if(in_array('3_of_diamonds', json_decode($p_row['hand'], true))) {
                $gameState['turn'] = $p_row['user_id'];
            }
        }
        $stmt_p->close();
        if(!isset($gameState['turn'])) $gameState['turn'] = $playerOrder[0]; // Fallback
        
        $gameState['lastPlay'] = null;
        $gameState['playerOrder'] = $playerOrder;
    }
    
    if ($gameState['turn'] !== $userId) sendErrorResponse('操作失败: 未轮到您出牌。', 403);
    
    // 验证出牌
    if (count(array_diff($playedCards, $playerHand)) > 0) sendErrorResponse('无效的出牌: 您没有这些牌。', 400);
    
    // 2. 根据游戏类型调用不同规则
    if ($room['game_type'] === 'doudizhu') {
        // ... (斗地主逻辑保持不变)
        $rule = new DoudizhuRule();
        if (!empty($playedCards)) {
            if (!$rule->isValidPlay($playedCards, $gameState['lastPlay']['cards'] ?? [])) sendErrorResponse('无效的出牌: 不符合斗地主规则。', 400);
        } else {
             if (empty($gameState['lastPlay']) || $gameState['lastPlay']['player'] === $userId) sendErrorResponse('您是当前最大出牌者，不能PASS。', 400);
        }
    } elseif ($room['game_type'] === 'big_two') {
        $rule = new BigTwoRule();
        if (empty($playedCards)) sendErrorResponse('锄大地不能PASS。', 400); // 锄大地通常规则是必须出
        if (!$rule->isValidPlay($playedCards, $gameState['lastPlay']['cards'] ?? [])) sendErrorResponse('无效的出牌: 不符合锄大地规则。', 400);
    }
    
    // 3. 更新手牌
    $newHand = array_diff($playerHand, $playedCards);
    $stmt = $conn->prepare("UPDATE players SET hand = ? WHERE room_id = ? AND user_id = ?");
    $stmt->bind_param("sss", json_encode(array_values($newHand)), $roomId, $userId);
    $stmt->execute();
    $stmt->close();
    
    // 4. 轮转和更新lastPlay
    $playerCount = count($gameState['playerOrder']);
    $currentIndex = array_search($userId, $gameState['playerOrder']);
    $gameState['turn'] = $gameState['playerOrder'][($currentIndex + 1) % $playerCount];
    
    if (!empty($playedCards)) {
        $gameState['lastPlay'] = ['player' => $userId, 'cards' => $playedCards];
    }
    
    // 5. 检查游戏是否结束
    if (empty($newHand)) {
        $room['status'] = 'finished';
        $gameState['winner'] = $userId;
        // TODO: 计算得分
    }
    
    // 6. 保存更新
    $stmt = $conn->prepare("UPDATE rooms SET status = ?, extra_data = ? WHERE room_id = ?");
    $stmt->bind_param("sss", $room['status'], json_encode($gameState), $roomId);
    $stmt->execute();
    $stmt->close();
    
    $conn->commit();
    sendSuccessResponse(['message' => '出牌成功'], "操作成功");

} catch (Exception $e) {
    $conn->rollback();
    error_log("出牌失败: " . $e->getMessage());
    sendErrorResponse("出牌时发生内部错误: " . $e->getMessage(), 500);
} finally {
    closeDbConnection($conn);
}
