<?php
namespace MyApp;

class ThirteenWaterRules {
    const SUITS = ['C', 'D', 'H', 'S']; // 梅花, 方块, 红桃, 黑桃
    const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];

    // 定义牌型，强度从低到高
    const TYPE_HIGH_CARD = 0;       // 乌龙
    const TYPE_ONE_PAIR = 1;        // 对子
    const TYPE_TWO_PAIR = 2;        // 两对
    const TYPE_THREE_OF_A_KIND = 3; // 三条
    const TYPE_STRAIGHT = 4;        // 顺子
    const TYPE_FLUSH = 5;           // 同花
    const TYPE_FULL_HOUSE = 6;      // 葫芦
    const TYPE_FOUR_OF_A_KIND = 7;  // 铁支
    const TYPE_STRAIGHT_FLUSH = 8;  // 同花顺

    private static $rankValues;

    private static function init() {
        if (self::$rankValues === null) {
            self::$rankValues = array_flip(self::RANKS);
        }
    }
    
    /**
     * 将牌的字符串（如'KH', 'TS'）转换为一个包含详细信息的对象
     * @param string $cardStr
     * @return array
     */
    private static function cardToObj($cardStr) {
        self::init();
        $rank = substr($cardStr, 0, 1);
        $suit = substr($cardStr, 1, 1);
        return [
            'rank' => $rank,
            'suit' => $suit,
            'value' => self::$rankValues[$rank] ?? -1
        ];
    }

    /**
     * 计算一手牌（3张或5张）的牌力
     * @param array $hand 一组牌的字符串数组
     * @return array 包含['type', 'score']，'score'用于精确比较大小
     */
    public static function getHandStrength($hand) {
        self::init();
        $cardCount = count($hand);
        
        // --- 3张牌的头道特殊处理 ---
        if ($cardCount === 3) {
            $cards = array_map('self::cardToObj', $hand);
            usort($cards, fn($a, $b) => $b['value'] - $a['value']);
            $values = array_column($cards, 'value');
            
            // 三条
            if ($values[0] === $values[1] && $values[1] === $values[2]) {
                return ['type' => self::TYPE_THREE_OF_A_KIND, 'score' => (self::TYPE_THREE_OF_A_KIND << 20) + $values[0]];
            }
            // 对子
            if ($values[0] === $values[1]) {
                return ['type' => self::TYPE_ONE_PAIR, 'score' => (self::TYPE_ONE_PAIR << 20) + ($values[0] << 4) + $values[2]];
            }
            if ($values[1] === $values[2]) {
                return ['type' => self::TYPE_ONE_PAIR, 'score' => (self::TYPE_ONE_PAIR << 20) + ($values[1] << 4) + $values[0]];
            }
            // 乌龙 (高牌)
            return ['type' => self::TYPE_HIGH_CARD, 'score' => (self::TYPE_HIGH_CARD << 20) + ($values[0] << 8) + ($values[1] << 4) + $values[2]];
        }

        // --- 5张牌的中道和尾道处理 ---
        if ($cardCount !== 5) {
            return ['type' => -1, 'score' => 0]; // 无效牌
        }

        $cards = array_map('self::cardToObj', $hand);
        usort($cards, fn($a, $b) => $b['value'] - $a['value']);
        
        $values = array_column($cards, 'value');
        $suits = array_column($cards, 'suit');
        $rankCounts = array_count_values(array_column($cards, 'rank'));
        arsort($rankCounts);

        $isFlush = count(array_unique($suits)) === 1;
        $isStraight = self::isStraight($values);

        // A-2-3-4-5 的特殊情况 (wheel)
        if ($isStraight && $values === [12, 3, 2, 1, 0]) {
             // 将A视为最小的牌，用于计算顺子得分
             $values = [3, 2, 1, 0, -1];
        }

        // 同花顺
        if ($isFlush && $isStraight) {
            return ['type' => self::TYPE_STRAIGHT_FLUSH, 'score' => (self::TYPE_STRAIGHT_FLUSH << 20) + $values[0]];
        }
        
        $counts = array_values($rankCounts);
        $ranks = array_keys($rankCounts);

        // 铁支
        if ($counts[0] === 4) {
            $fourRankValue = self::$rankValues[$ranks[0]];
            $kickerValue = self::$rankValues[$ranks[1]];
            return ['type' => self::TYPE_FOUR_OF_A_KIND, 'score' => (self::TYPE_FOUR_OF_A_KIND << 20) + ($fourRankValue << 4) + $kickerValue];
        }

        // 葫芦
        if ($counts[0] === 3 && $counts[1] === 2) {
            $threeRankValue = self::$rankValues[$ranks[0]];
            $pairRankValue = self::$rankValues[$ranks[1]];
            return ['type' => self::TYPE_FULL_HOUSE, 'score' => (self::TYPE_FULL_HOUSE << 20) + ($threeRankValue << 4) + $pairRankValue];
        }

        // 同花
        if ($isFlush) {
            $score = (self::TYPE_FLUSH << 20) + ($values[0] << 16) + ($values[1] << 12) + ($values[2] << 8) + ($values[3] << 4) + $values[4];
            return ['type' => self::TYPE_FLUSH, 'score' => $score];
        }
        
        // 顺子
        if ($isStraight) {
            return ['type' => self::TYPE_STRAIGHT, 'score' => (self::TYPE_STRAIGHT << 20) + $values[0]];
        }

        // 三条
        if ($counts[0] === 3) {
             $threeRankValue = self::$rankValues[$ranks[0]];
             $kickers = array_values(array_diff($values, [$threeRankValue]));
             $score = (self::TYPE_THREE_OF_A_KIND << 20) + ($threeRankValue << 8) + ($kickers[0] << 4) + $kickers[1];
             return ['type' => self::TYPE_THREE_OF_A_KIND, 'score' => $score];
        }
        
        // 两对
        if ($counts[0] === 2 && $counts[1] === 2) {
            $highPairValue = self::$rankValues[$ranks[0]];
            $lowPairValue = self::$rankValues[$ranks[1]];
            $kickerValue = self::$rankValues[$ranks[2]];
            return ['type' => self::TYPE_TWO_PAIR, 'score' => (self::TYPE_TWO_PAIR << 20) + ($highPairValue << 8) + ($lowPairValue << 4) + $kickerValue];
        }

        // 对子
        if ($counts[0] === 2) {
            $pairValue = self::$rankValues[$ranks[0]];
            $kickers = array_values(array_diff($values, [$pairValue]));
            $score = (self::TYPE_ONE_PAIR << 20) + ($pairValue << 12) + ($kickers[0] << 8) + ($kickers[1] << 4) + $kickers[2];
            return ['type' => self::TYPE_ONE_PAIR, 'score' => $score];
        }

        // 乌龙 (高牌)
        $score = (self::TYPE_HIGH_CARD << 20) + ($values[0] << 16) + ($values[1] << 12) + ($values[2] << 8) + ($values[3] << 4) + $values[4];
        return ['type' => self::TYPE_HIGH_CARD, 'score' => $score];
    }
    
    /**
     * 检查一组按降序排列的牌值是否构成顺子
     * @param array $values 牌值数组
     * @return bool
     */
    private static function isStraight($values) {
        // A-2-3-4-5 的特殊情况 (wheel)
        if ($values === [self::$rankValues['A'], self::$rankValues['5'], self::$rankValues['4'], self::$rankValues['3'], self::$rankValues['2']]) {
            return true;
        }
        // 普通顺子
        for ($i = 0; $i < count($values) - 1; $i++) {
            if ($values[$i] !== $values[$i+1] + 1) {
                return false;
            }
        }
        return true;
    }

    /**
     * 比较两手牌的大小
     * @param array $hand1
     * @param array $hand2
     * @return int > 0 if hand1 is stronger, < 0 if hand2 is stronger, 0 if equal
     */
    public static function compareHands($hand1, $hand2) {
        $strength1 = self::getHandStrength($hand1);
        $strength2 = self::getHandStrength($hand2);
        return $strength1['score'] - $strength2['score'];
    }

    /**
     * 检查玩家提交的三道牌是否“倒水”（相公）
     * @param array $head
     * @param array $middle
     * @param array $tail
     * @return bool true if foul, false otherwise
     */
    public static function isFoul($head, $middle, $tail) {
        $headStrength = self::getHandStrength($head);
        $middleStrength = self::getHandStrength($middle);
        $tailStrength = self::getHandStrength($tail);

        // 尾道必须大于等于中道，中道必须大于等于头道
        if ($tailStrength['score'] < $middleStrength['score'] || $middleStrength['score'] < $headStrength['score']) {
            return true;
        }
        return false;
    }
}
