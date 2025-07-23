<?php
namespace MyApp;

class ThirteenWaterRules {
    // 基础定义
    const SUITS = ['C', 'D', 'H', 'S']; // 梅花, 方块, 红桃, 黑桃
    const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];

    // 常规牌型 (从低到高)
    const TYPE_HIGH_CARD = 0;       // 乌龙
    const TYPE_ONE_PAIR = 1;        // 对子
    const TYPE_TWO_PAIR = 2;        // 两对
    const TYPE_THREE_OF_A_KIND = 3; // 三条
    const TYPE_STRAIGHT = 4;        // 顺子
    const TYPE_FLUSH = 5;           // 同花
    const TYPE_FULL_HOUSE = 6;      // 葫芦
    const TYPE_FOUR_OF_A_KIND = 7;  // 铁支
    const TYPE_STRAIGHT_FLUSH = 8;  // 同花顺

    // 特殊牌型 (无需比牌，直接计分)
    const TYPE_SIX_PAIRS = 9;         // 六对半
    const TYPE_THREE_FLUSHES = 10;    // 三同花
    const TYPE_THREE_STRAIGHTS = 11;  // 三顺子
    const TYPE_ALL_SMALL = 12;        // 全小 (8或以下)
    const TYPE_ALL_BIG = 13;          // 全大 (8或以上)
    const TYPE_SAME_COLOR = 14;       // 凑一色 (全黑或全红)
    const TYPE_FOUR_THREES = 15;      // 四套三条
    const TYPE_THIRTEEN_SAME = 16;    // 至尊清龙 (十三张同花)
    const TYPE_DRAGON = 17;           // 一条龙 (A-K顺子)
    
    private static $rankValues;

    // 初始化牌值映射
    private static function init() {
        if (self::$rankValues === null) {
            self::$rankValues = array_flip(self::RANKS);
        }
    }

    /**
     * 将牌的字符串（如'KH'）转换为包含详细信息的对象
     */
    private static function cardToObj($cardStr) {
        self::init();
        $rank = substr($cardStr, 0, 1);
        $suit = substr($cardStr, 1, 1);
        return ['str' => $cardStr, 'rank' => $rank, 'suit' => $suit, 'value' => self::$rankValues[$rank] ?? -1];
    }

    /**
     * 检查一组按降序排列的牌值是否构成顺子
     */
    private static function isStraight($values) {
        // A-2-3-4-5 的特殊情况 (wheel)
        if (count($values) === 5 && $values === [self::$rankValues['A'], self::$rankValues['5'], self::$rankValues['4'], self::$rankValues['3'], self::$rankValues['2']]) {
            return true;
        }
        // 普通顺子
        for ($i = 0; $i < count($values) - 1; $i++) {
            if ($values[$i] !== $values[$i+1] + 1) return false;
        }
        return true;
    }
    
    /**
     * 计算一手牌（3张或5张）的牌力
     */
    public static function getHandStrength($hand) {
        self::init();
        $cardCount = count($hand);
        $cards = array_map('self::cardToObj', $hand);
        usort($cards, fn($a, $b) => $b['value'] - $a['value']);
        $values = array_column($cards, 'value');

        // --- 3张牌的头道 ---
        if ($cardCount === 3) {
            // 三条
            if ($values[0] === $values[2]) {
                return ['type' => self::TYPE_THREE_OF_A_KIND, 'score' => (self::TYPE_THREE_OF_A_KIND << 20) + $values[0]];
            }
            // 对子
            if ($values[0] === $values[1]) return ['type' => self::TYPE_ONE_PAIR, 'score' => (self::TYPE_ONE_PAIR << 20) + ($values[0] << 4) + $values[2]];
            if ($values[1] === $values[2]) return ['type' => self::TYPE_ONE_PAIR, 'score' => (self::TYPE_ONE_PAIR << 20) + ($values[1] << 4) + $values[0]];
            // 乌龙
            return ['type' => self::TYPE_HIGH_CARD, 'score' => (self::TYPE_HIGH_CARD << 20) + ($values[0] << 8) + ($values[1] << 4) + $values[2]];
        }

        // --- 5张牌的中道和尾道 ---
        if ($cardCount !== 5) return ['type' => -1, 'score' => 0];

        $suits = array_column($cards, 'suit');
        $rankCounts = array_count_values(array_column($cards, 'rank'));
        arsort($rankCounts);
        
        $isFlush = count(array_unique($suits)) === 1;
        $isStraight = self::isStraight($values);
        $wheelStraightValues = [3, 2, 1, 0, -1]; // A-5-4-3-2 的特殊分值
        
        if ($isStraight && $values === [12, 3, 2, 1, 0]) { // A-5 wheel 顺子
             $scoreValues = $wheelStraightValues;
        } else {
             $scoreValues = $values;
        }

        // 同花顺
        if ($isFlush && $isStraight) return ['type' => self::TYPE_STRAIGHT_FLUSH, 'score' => (self::TYPE_STRAIGHT_FLUSH << 20) + $scoreValues[0]];
        
        $counts = array_values($rankCounts);
        $ranks = array_keys($rankCounts);

        // 铁支
        if ($counts[0] === 4) {
            $score = (self::TYPE_FOUR_OF_A_KIND << 20) + (self::$rankValues[$ranks[0]] << 4) + self::$rankValues[$ranks[1]];
            return ['type' => self::TYPE_FOUR_OF_A_KIND, 'score' => $score];
        }

        // 葫芦
        if ($counts[0] === 3 && $counts[1] === 2) {
             return ['type' => self::TYPE_FULL_HOUSE, 'score' => (self::TYPE_FULL_HOUSE << 20) + (self::$rankValues[$ranks[0]] << 4) + self::$rankValues[$ranks[1]]];
        }

        // 同花
        if ($isFlush) {
            $score = ($values[0] << 16) + ($values[1] << 12) + ($values[2] << 8) + ($values[3] << 4) + $values[4];
            return ['type' => self::TYPE_FLUSH, 'score' => (self::TYPE_FLUSH << 20) + $score];
        }
        
        // 顺子
        if ($isStraight) return ['type' => self::TYPE_STRAIGHT, 'score' => (self::TYPE_STRAIGHT << 20) + $scoreValues[0]];

        // 三条
        if ($counts[0] === 3) {
             $kickers = array_values(array_diff($values, [self::$rankValues[$ranks[0]]]));
             $score = (self::TYPE_THREE_OF_A_KIND << 20) + (self::$rankValues[$ranks[0]] << 8) + ($kickers[0] << 4) + $kickers[1];
             return ['type' => self::TYPE_THREE_OF_A_KIND, 'score' => $score];
        }
        
        // 两对
        if ($counts[0] === 2 && $counts[1] === 2) {
            $score = (self::$rankValues[($ranks[0])] << 8) + (self::$rankValues[($ranks[1])] << 4) + self::$rankValues[($ranks[2])];
            return ['type' => self::TYPE_TWO_PAIR, 'score' => (self::TYPE_TWO_PAIR << 20) + $score];
        }

        // 对子
        if ($counts[0] === 2) {
            $kickers = array_values(array_diff($values, [self::$rankValues[$ranks[0]]]));
            $score = (self::$rankValues[$ranks[0]] << 12) + ($kickers[0] << 8) + ($kickers[1] << 4) + $kickers[2];
            return ['type' => self::TYPE_ONE_PAIR, 'score' => $score];
        }

        // 乌龙 (高牌)
        $score = ($values[0] << 16) + ($values[1] << 12) + ($values[2] << 8) + ($values[3] << 4) + $values[4];
        return ['type' => self::TYPE_HIGH_CARD, 'score' => $score];
    }

    /**
     * 检查玩家提交的三道牌是否“倒水”
     */
    public static function isFoul($head, $middle, $tail) {
        $headStrength = self::getHandStrength($head);
        $middleStrength = self::getHandStrength($middle);
        $tailStrength = self::getHandStrength($tail);
        return $tailStrength['score'] < $middleStrength['score'] || $middleStrength['score'] < $headStrength['score'];
    }

    /**
     * 检测13张手牌是否构成特殊牌型
     */
    public static function getSpecialHandType($allCards) {
        if (count($allCards) !== 13) return null;
        self::init();
        $cards = array_map('self::cardToObj', $allCards);
        usort($cards, fn($a, $b) => $b['value'] - $a['value']);
        $ranks = array_column($cards, 'rank');
        $suits = array_column($cards, 'suit');
        $values = array_column($cards, 'value');

        // 一条龙 (A-K) 或 至尊清龙 (同花一条龙)
        $isDragon = array_unique($values) === self::$rankValues;
        if ($isDragon) return count(array_unique($suits)) === 1 ? self::TYPE_THIRTEEN_SAME : self::TYPE_DRAGON;

        $rankCounts = array_count_values($ranks);
        // 六对半 / 四套三条
        if(count($rankCounts) === 7 && in_array(1, $rankCounts)) return self::TYPE_SIX_PAIRS;
        if(count($rankCounts) === 4 && in_array(1, $rankCounts)) return self::TYPE_FOUR_THREES;
        // 其他特殊牌型... (按需添加)
        return null;
    }
    
    /**
     * 最终计分函数
     * @param array $playersData [['id' => id, 'hands' => ['head' => [...], 'middle' => [...], 'tail' => [...]]], ...]
     * @return array ['scores' => [...], 'details' => [...]]
     */
    public static function calcAllScores($playersData) {
        $playerCount = count($playersData);
        $scores = array_fill_keys(array_column($playersData, 'id'), 0);
        $details = [];

        // 1. 检查倒水和计算各道牌力
        foreach ($playersData as &$player) {
            $player['is_foul'] = self::isFoul($player['hands']['head'], $player['hands']['middle'], $player['hands']['tail']);
            if (!$player['is_foul']) {
                $player['strengths']['head'] = self::getHandStrength($player['hands']['head']);
                $player['strengths']['middle'] = self::getHandStrength($player['hands']['middle']);
                $player['strengths']['tail'] = self::getHandStrength($player['hands']['tail']);
            }
        }
        unset($player); //
        
        // 2. 两两比较计分
        for ($i = 0; $i < $playerCount; $i++) {
            for ($j = $i + 1; $j < $playerCount; $j++) {
                $p1 = $playersData[$i];
                $p2 = $playersData[$j];
                $p1id = $p1['id'];
                $p2id = $p2['id'];
                $roundScore = 0;
                
                // 处理倒水
                if ($p1['is_foul'] && !$p2['is_foul']) { $roundScore = -3; } // p1倒水，p2没倒，p1输3分
                elseif (!$p1['is_foul'] && $p2['is_foul']) { $roundScore = 3; } // p2倒水，p1没倒，p1赢3分
                elseif ($p1['is_foul'] && $p2['is_foul']) { $roundScore = 0; } // 都倒水，平局
                else { // 正常比牌
                    $p1WinPoints = 0;
                    if ($p1['strengths']['head']['score'] > $p2['strengths']['head']['score']) $p1WinPoints++;
                    if ($p1['strengths']['middle']['score'] > $p2['strengths']['middle']['score']) $p1WinPoints++;
                    if ($p1['strengths']['tail']['score'] > $p2['strengths']['tail']['score']) $p1WinPoints++;
                    
                    if ($p1WinPoints === 3) { $roundScore = 3; } // 打枪
                    elseif ($p1WinPoints === 0) { $roundScore = -3; } // 被打枪
                    else { $roundScore = $p1WinPoints - (3 - $p1WinPoints); }
                }
                
                $scores[$p1id] += $roundScore;
                $scores[$p2id] -= $roundScore;
                $details[] = "{$p1id} vs {$p2id}: {$roundScore} points";
            }
        }
        
        return ['scores' => $scores, 'details' => $details];
    }
}
