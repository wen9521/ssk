<?php
// backend/api/reset-room.php (v2)

header('Content-Type: application/json');
require_once '../db.php';

$data = json_decode(file_get_contents('php://input'), true);
$room_id = $data['room_id'] ?? '';
$player_id = $data['player_id'] ?? ''; // The player initiating the reset

if (empty($room_id) || empty($player_id)) {
    http_response_code(400);
    send_json_response(['success' => false, 'message' => '缺少房间号或玩家ID']);
    exit;
}

$conn->begin_transaction();

try {
    // 1. Verify the requester is the host of the room.
    $stmt = $conn->prepare("SELECT host_id FROM rooms WHERE room_id = ?");
    $stmt->bind_param("s", $room_id);
    $stmt->execute();
    $room_data = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$room_data) {
        throw new Exception("房间不存在");
    }
    if ($room_data['host_id'] !== $player_id) {
        throw new Exception("只有房主才能重置游戏");
    }

    // 2. Reset the room's status and clear any game-specific data.
    $stmt_room_status = $conn->prepare(
        "UPDATE rooms 
         SET status = 'lobby', game_data = NULL 
         WHERE room_id = ?"
    );
    $stmt_room_status->bind_param("s", $room_id);
    $stmt_room_status->execute();
    $stmt_room_status->close();
    
    // 3. Reset all players in the room for a new game.
    // This clears their game-related data but keeps them in the room.
    $stmt_reset_players = $conn->prepare(
        "UPDATE players 
         SET hand = NULL, dun = NULL, is_ready = 0, score = 0 
         WHERE room_id = ?"
    );
    $stmt_reset_players->bind_param("s", $room_id);
    $stmt_reset_players->execute();
    $stmt_reset_players->close();

    // All went well, commit the changes.
    $conn->commit();

    send_json_response(['success' => true, 'message' => '房间已重置，可以开始新一局']);

} catch (Exception $e) {
    // If anything goes wrong, roll back the transaction.
    $conn->rollback();
    http_response_code(403); // Use 403 for permission errors, 500 for others
    send_json_response(['success' => false, 'message' => $e->getMessage()]);
}

closeDbConnection($conn);
?>
