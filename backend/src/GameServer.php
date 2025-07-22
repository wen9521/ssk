<?php
namespace MyApp;

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;
use MyApp\ThirteenWaterRules; // 引入我们强大的规则引擎

class GameServer implements MessageComponentInterface
{
    protected $clients;
    protected $players = [];
    protected $playerData = []; // 用于存储玩家的牌等信息

    protected $gameState = [
        'status' => 'waiting', // waiting, dealing, playing, finished
        'deck' => [],
        'submittedHands' => [], // 存储玩家已提交的、合法的牌组
        'scores' => [],
        'roundResults' => [], // 存储本回合的比牌结果和得分
    ];

    public function __construct()
    {
        $this->clients = new \SplObjectStorage;
        echo "GameServer class initialized.
";
    }

    public function onOpen(ConnectionInterface $conn)
    {
        $this->clients->attach($conn);
        $playerId = $conn->resourceId;
        $this->players[$playerId] = $conn;
        if (!isset($this->gameState['scores'][$playerId])) {
            $this->gameState['scores'][$playerId] = 0; // 初始化积分为0
        }
        echo "New connection! ({$playerId})
";
        $this->broadcastState();
    }

    public function onMessage(ConnectionInterface $from, $msg)
    {
        $playerId = $from->resourceId;
        $data = json_decode($msg, true);

        if (!$data || !isset($data['type'])) {
            $this->sendError($from, "无效的消息格式");
            return;
        }

        echo sprintf("Connection %d sending message of type "%s"
", $playerId, $data['type']);

        switch ($data['type']) {
            case 'start_game':
                $this->startGame();
                break;
            case 'submit_hand':
                if (isset($data['hand']['head']) && isset($data['hand']['middle']) && isset($data['hand']['tail'])) {
                    $this->processPlayerHand($playerId, $data['hand']);
                } else {
                    $this->sendError($from, "提交的牌组格式不正确");
                }
                break;
        }
    }

    public function onClose(ConnectionInterface $conn)
    {
        $playerId = $conn->resourceId;
        $this->clients->detach($conn);
        unset($this->players[$playerId]);
        unset($this->playerData[$playerId]);
        unset($this->gameState['submittedHands'][$playerId]);

        echo "Connection {$playerId} has disconnected
";

        // 如果游戏正在进行中，且所有剩余玩家都已出牌，则结束回合
        if ($this->gameState['status'] === 'playing' && count($this->gameState['submittedHands']) === count($this->players)) {
            $this->evaluateRound();
        }

        $this->broadcastState();
    }

    public function onError(ConnectionInterface $conn, \Exception $e)
    {
        echo "An error has occurred: {$e->getMessage()}
";
        $this->sendError($conn, "服务器内部错误");
        $conn->close();
    }

    // --- 核心游戏逻辑函数 ---

    protected function startGame()
    {
        if ($this->gameState['status'] !== 'waiting' && $this->gameState['status'] !== 'finished') {
            return; // 游戏已在进行中
        }
        if (count($this->players) < 2) {
            // 人数不足，可以向发起者发送提示
            $playerId = array_key_first($this->players);
            $this->sendError($this->players[$playerId], "至少需要2名玩家才能开始游戏");
            return;
        }

        echo "Starting a new game...
";
        $this->gameState['status'] = 'dealing';
        $this->gameState['submittedHands'] = [];
        $this->gameState['roundResults'] = [];
        $this->initializeDeck();
        $this->dealCards();
        $this->gameState['status'] = 'playing'; // 切换到“出牌中”状态
        $this->broadcastState();
    }
    
    protected function processPlayerHand($playerId, $hand)
    {
        if ($this->gameState['status'] !== 'playing') {
            $this->sendError($this->players[$playerId], "现在不是出牌时间");
            return;
        }
        if (isset($this->gameState['submittedHands'][$playerId])) {
            $this->sendError($this->players[$playerId], "您已经出过牌了");
            return;
        }

        // 使用我们的规则引擎来验证牌组
        if (ThirteenWaterRules::isFoul($hand['head'], $hand['middle'], $hand['tail'])) {
            $this->sendError($this->players[$playerId], "出牌错误，请检查您的牌组是否“倒水”");
            return;
        }

        // 牌组合法，予以接受
        $this->gameState['submittedHands'][$playerId] = $hand;
        echo "Player {$playerId} submitted a valid hand.
";

        // 检查是否所有人都已出牌
        if (count($this->gameState['submittedHands']) === count($this->players)) {
            $this->evaluateRound();
        }
        
        $this->broadcastState();
    }

    protected function evaluateRound()
    {
        echo "All players have submitted. Evaluating round...
";
        $this->gameState['status'] = 'finished';
        
        $playerIds = array_keys($this->players);
        $roundScores = array_fill_keys($playerIds, 0);

        // 两两比较所有玩家的牌
        for ($i = 0; $i < count($playerIds); $i++) {
            for ($j = $i + 1; $j < count($playerIds); $j++) {
                $p1_id = $playerIds[$i];
                $p2_id = $playerIds[$j];

                $p1_hand = $this->gameState['submittedHands'][$p1_id];
                $p2_hand = $this->gameState['submittedHands'][$p2_id];
                
                $comparisonScore = 0;
                // 比较头道
                $comparisonScore += $this->compareAndScore($p1_hand['head'], $p2_hand['head']);
                // 比较中道
                $comparisonScore += $this->compareAndScore($p1_hand['middle'], $p2_hand['middle']);
                // 比较尾道
                $comparisonScore += $this->compareAndScore($p1_hand['tail'], $p2_hand['tail']);
                
                // TODO: 在这里可以加入“打枪”等特殊分逻辑

                $roundScores[$p1_id] += $comparisonScore;
                $roundScores[$p2_id] -= $comparisonScore;
            }
        }
        
        // 更新总分
        foreach($roundScores as $playerId => $score) {
            $this->gameState['scores'][$playerId] += $score;
        }

        $this->gameState['roundResults'] = ['scores' => $roundScores]; // 存储本局详情
        echo "Round finished. Scores calculated.
";

        $this->broadcastState();
    }

    /**
     * 比较两手牌，返回得分（1, -1, 0）
     */
    private function compareAndScore($hand1, $hand2) {
        $result = ThirteenWaterRules::compareHands($hand1, $hand2);
        if ($result > 0) return 1;
        if ($result < 0) return -1;
        return 0;
    }


    // --- 辅助和网络函数 ---

    protected function broadcastState()
    {
        $stateToSend = $this->gameState;
        unset($stateToSend['deck']); // 不把牌库发给客户端

        // 为每个客户端构建一个定制化的状态信息
        foreach ($this->clients as $client) {
            $playerId = $client->resourceId;
            
            // 包含了所有公开的游戏状态
            $clientState = $stateToSend; 
            // 单独把玩家自己的手牌放进去
            $clientState['myHand'] = $this->playerData[$playerId]['hand'] ?? [];
            
            $response = json_encode(['type' => 'game_state', 'payload' => $clientState]);
            $client->send($response);
        }
    }

    protected function sendError(ConnectionInterface $conn, $message) {
        $response = json_encode(['type' => 'error', 'payload' => $message]);
        $conn->send($response);
    }
    
    protected function initializeDeck()
    {
        $this->gameState['deck'] = [];
        $suits = ThirteenWaterRules::SUITS;
        $ranks = ThirteenWaterRules::RANKS;
        foreach ($suits as $suit) {
            foreach ($ranks as $rank) {
                $this->gameState['deck'][] = $rank . $suit;
            }
        }
        shuffle($this->gameState['deck']);
    }

    protected function dealCards()
    {
        $this->playerData = [];
        $playerIds = array_keys($this->players);
        $cardsPerPlayer = 13;

        foreach ($playerIds as $playerId) {
            $this->playerData[$playerId] = ['hand' => []];
        }

        for ($i = 0; $i < $cardsPerPlayer; $i++) {
            foreach ($playerIds as $playerId) {
                $card = array_pop($this->gameState['deck']);
                if ($card) {
                    $this->playerData[$playerId]['hand'][] = $card;
                }
            }
        }
        
        // 注意：现在dealCards不直接发送手牌，而是由broadcastState统一处理
    }
}
