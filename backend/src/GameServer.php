<?php
namespace MyApp;

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;
use MyApp\Game\Room;

class GameServer implements MessageComponentInterface {
    protected $clients;
    protected $rooms;

    public function __construct() {
        $this->clients = new \SplObjectStorage;
        $this->rooms = [];
        echo "游戏服务器已启动...\n";
    }

    public function onOpen(ConnectionInterface $conn) {
        $this->clients->attach($conn);
        echo "新玩家连接: {$conn->resourceId}\n";
    }

    public function onMessage(ConnectionInterface $from, $msg) {
        $data = json_decode($msg, true);
        if (!$data || !isset($data['action'])) {
            return;
        }

        // 简单的路由
        switch ($data['action']) {
            case 'create_room':
                // 创建一个斗地主房间
                $roomId = uniqid('room_');
                $this->rooms[$roomId] = new Room($roomId, 'doudizhu');
                $this->rooms[$roomId]->addPlayer($from);
                $from->send(json_encode(['action' => 'room_created', 'roomId' => $roomId]));
                break;

            case 'join_room':
                $roomId = $data['roomId'];
                if (isset($this->rooms[$roomId]) && !$this->rooms[$roomId]->isFull()) {
                    $this->rooms[$roomId]->addPlayer($from);
                    
                    // 如果房间满了，开始游戏
                    if ($this->rooms[$roomId]->isFull()) {
                        $this->rooms[$roomId]->startGame(); // 这个方法会发牌并通知所有玩家
                    }
                } else {
                    $from->send(json_encode(['action' => 'error', 'message' => '房间不存在或已满']));
                }
                break;
                
            case 'play_card':
                // 后端核心逻辑：验证出牌并广播
                $roomId = $this->findRoomByPlayer($from);
                if ($roomId) {
                    $room = $this->rooms[$roomId];
                    // 权威验证
                    if ($room->handlePlayerAction($from, $data)) {
                        // 如果验证通过, Room对象内部会更新状态并广播给所有玩家
                    } else {
                        $from->send(json_encode(['action' => 'invalid_play', 'message' => '出牌不符合规则']));
                    }
                }
                break;
        }
    }

    public function onClose(ConnectionInterface $conn) {
        // 处理玩家断线
        $this->clients->detach($conn);
        echo "玩家断开连接: {$conn->resourceId}\n";
        // TODO: 从房间中移除玩家，并通知其他玩家
    }

    public function onError(ConnectionInterface $conn, \Exception $e) {
        echo "发生错误: {$e->getMessage()}\n";
        $conn->close();
    }
    
    private function findRoomByPlayer(ConnectionInterface $conn) {
        foreach ($this->rooms as $roomId => $room) {
            if ($room->hasPlayer($conn)) {
                return $roomId;
            }
        }
        return null;
    }
}
