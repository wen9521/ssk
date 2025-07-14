<?php
// backend/api/matchmaking.php
// 描述: 处理自动匹配队列的加入、离开、状态查询和核心匹配逻辑。

require_once '../utils/cors.php';
require_once '../db.php';
require_once '../utils/response.php';
require_once '../utils/cardUtils.php';
require_once '../utils/DoudizhuCardUtils.php';

header("Content-Type: application/json; charset=UTF-8");

$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? null;
$userId = $input['userId'] ?? null;
$gameType = $input['gameType'] ?? null;

if (empty($userId) || empty($action)) {
    sendErrorResponse('操作失败: 缺少 userId 或 action。', 400);
}

$conn = getDbConnection();

// --- 根据 action 执行不同逻辑 ---
switch ($action) {
    case 'join':
        if (empty($gameType)) sendErrorResponse('加入队列失败: 缺少 gameType。', 400);
        joinQueue($conn, $userId, $gameType);
        break;
    case 'leave':
        leaveQueue($conn, $userId);
        break;
    case 'status':
        checkStatus($conn, $userId);
        break;
    default:
        sendErrorResponse('无效的 action。', 400);
}

// --- 函数定义 ---

function joinQueue($conn, $userId, $gameType) {
    $conn->begin_transaction();
    try {
        // 清理该用户旧的、可能存在的 'waiting' 记录
        $stmt = $conn->prepare("DELETE FROM matchmaking_queue WHERE user_id = ? AND status = 'waiting'");
        $stmt->bind_param("s", $userId);
        $stmt->execute();
        $stmt->close();
        
        // 加入队列
        $stmt = $conn->prepare("INSERT INTO matchmaking_queue (user_id, game_type) VALUES (?, ?)");
        $stmt->bind_param("ss", $userId, $gameType);
        $stmt->execute();
        $stmt->close();
        
        $conn->commit();
        
        // 尝试执行匹配
        tryMatch($conn, $gameType);
        sendSuccessResponse(['status' => 'waiting'], "成功加入匹配队列。");

    } catch (Exception $e) {
        $conn->rollback();
        // 捕获唯一键冲突错误，说明用户已在队列中
        if ($conn->errno === 1062) {
             sendErrorResponse("您已在匹配队列中，请勿重复加入。", 409);
        }
        error_log("加入队列失败: " . $e->getMessage());
        sendErrorResponse("加入队列时发生内部错误。", 500);
    }
}

function leaveQueue($conn, $userId) {
    $stmt = $conn->prepare("DELETE FROM matchmaking_queue WHERE user_id = ? AND status = 'waiting'");
    $stmt->bind_param("s", $userId);
    $stmt->execute();
    
    if ($stmt->affected_rows > 0) {
        sendSuccessResponse(null, "已成功离开匹配队列。");
    } else {
        sendErrorResponse("您不在匹配队列中。", 404);
    }
    $stmt->close();
}

function checkStatus($conn, $userId) {
    $stmt = $conn->prepare("SELECT status, matched_room_id FROM matchmaking_queue WHERE user_id = ? ORDER BY entered_at DESC LIMIT 1");
    $stmt->bind_param("s", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($row = $result->fetch_assoc()) {
        if ($row['status'] === 'matched') {
            // 匹配成功后，从队列中删除该记录，防止重复查询
            $stmt_delete = $conn->prepare("DELETE FROM matchmaking_queue WHERE user_id = ? AND status = 'matched'");
            $stmt_delete->bind_param("s", $userId);
            $stmt_delete->execute();
            $stmt_delete->close();
        }
        sendSuccessResponse($row, "状态查询成功。");
    } else {
        sendSuccessResponse(['status' => 'not_in_queue'], "您不在任何队列中。");
    }
    $stmt->close();
}

function tryMatch($conn, $gameType) {
    $conn->begin_transaction();
    try {
        $maxPlayers = ($gameType === 'doudizhu') ? 3 : 4;
        
        // 锁定并获取足够数量的等待中的玩家
        $stmt = $conn->prepare("SELECT id, user_id FROM matchmaking_queue WHERE game_type = ? AND status = 'waiting' ORDER BY entered_at ASC LIMIT ? FOR UPDATE");
        $stmt->bind_param("si", $gameType, $maxPlayers);
        $stmt->execute();
        $result = $stmt->get_result();
        $playersToMatch = $result->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        
        if (count($playersToMatch) === $maxPlayers) {
            // --- 凑齐了玩家，开始创建游戏 ---
            $playerIds = array_column($playersToMatch, 'user_id');
            $playerRecordIds = array_column($playersToMatch, 'id');
            $roomId = 'match_' . bin2hex(random_bytes(3));
            
            // 和 quick-play.php 中类似的逻辑
            // 1. 创建房间
            $stmt = $conn->prepare("INSERT INTO rooms (room_id, game_type, status) VALUES (?, ?, 'playing')");
            $stmt->bind_param("ss", $roomId, $gameType);
            $stmt->execute();
            $stmt->close();

            // 2. 添加玩家
            $stmt_p = $conn->prepare("INSERT INTO players (room_id, user_id, is_creator) VALUES (?, ?, ?)");
            foreach($playerIds as $index => $pid) {
                $isCreator = ($index === 0);
                $stmt_p->bind_param("ssi", $roomId, $pid, $isCreator);
                $stmt_p->execute();
            }
            $stmt_p->close();
            
            // 3. 发牌 & 更新房间状态
            $nextRoomStatus = 'playing';
            if ($gameType === 'thirteen_water' || $gameType === 'big_two') $hands = dealCardsForPlayers($playerIds);
            else if ($gameType === 'doudizhu') {
                $dealResult = dealCardsForDoudizhu($playerIds);
                $hands = $dealResult['hands'];
                $biddingState = ['landlordCards' => $dealResult['landlordCards'], /*...*/];
                $stmt_e = $conn->prepare("UPDATE rooms SET extra_data = ? WHERE room_id = ?");
                $stmt_e->bind_param("ss", json_encode($biddingState), $roomId);
                $stmt_e->execute();
                $stmt_e->close();
                $nextRoomStatus = 'bidding';
            }
            // 更新手牌... (此处省略与quick-play重复的代码)

            // 4. 更新队列中玩家的状态
            $ids_placeholder = implode(',', array_fill(0, count($playerRecordIds), '?'));
            $stmt_q = $conn->prepare("UPDATE matchmaking_queue SET status = 'matched', matched_room_id = ? WHERE id IN ($ids_placeholder)");
            $params = array_merge([$roomId], $playerRecordIds);
            $types = 's' . str_repeat('i', count($playerRecordIds));
            $stmt_q->bind_param($types, ...$params);
            $stmt_q->execute();
            $stmt_q->close();
        }
        
        $conn->commit();
    } catch (Exception $e) {
        $conn->rollback();
        error_log("匹配尝试失败: " . $e->getMessage());
    }
}
