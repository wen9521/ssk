<?php
// backend/utils/ThirteenWaterRule.php

class ThirteenWaterRule {
    private $ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace'];
    private $suits = ['diamonds', 'clubs', 'hearts', 'spades'];
    private $cardValues = [];

    // 定义牌型常量
    const TYPE_HIGH_CARD = 1;
    const TYPE_PAIR = 2;
    const TYPE_TWO_PAIR = 3;
    const TYPE_THREE_OF_A_KIND = 4;
    const TYPE_STRAIGHT = 5;
    const TYPE_FLUSH = 6;
    const TYPE_FULL_HOUSE = 7;
    const TYPE_FOUR_OF_A_KIND = 8;
    const TYPE_STRAIGHT_FLUSH = 9;
    
    // 特殊牌型
    const TYPE_DRAGON = 10; // 一条龙

    public function __construct() {
        // 初始化牌值映射
        foreach ($this->ranks as $i => $rank) {
            $this->cardValues[$rank] = $i + 2;
        }
    }

    /**
     * 解析单张牌，返回其值和花色
     */
    private function getCardInfo($card) {
        [$rank, $suit] = explode('_of_', $card);
        return ['value' => $this->cardValues[$rank], 'suit' => array_search($suit, $this->suits)];
    }

    /**
     * 获取一手牌的牌型和决定其大小的关键“牌阶”
     * @param array $hand 3张或5张牌
     * @return array ['type' => 牌型, 'rank' => [主要牌阶, 次要牌阶, ...]]
     */
    public function getHandType(array $hand) {
        $count = count($hand);
        $values = [];
        $suits = [];
        $valueCounts = array_fill_keys(array_values($this->cardValues), 0);
        
        foreach ($hand as $card) {
            $info = $this->getCardInfo($card);
            $values[] = $info['value'];
            $suits[] = $info['suit'];
            $valueCounts[$info['value']]++;
        }
        
        rsort($values); // 对牌值进行降序排序
        $isFlush = count(array_unique($suits)) === 1;
        
        // 判断是否为顺子
        $uniqueValues = array_unique($values);
        $isStraight = (count($uniqueValues) === 5) && ($uniqueValues[0] - $uniqueValues[4] === 4);
        // 特殊顺子 A2345
        if (!$isStraight && $uniqueValues === [14, 5, 4, 3, 2]) {
             $isStraight = true;
             $values = [5, 4, 3, 2, 1]; // 将A视为1来比较顺子大小
        }

        // --- 开始判断牌型 (从大到小) ---
        // 5张牌的牌型
        if ($count === 5) {
            if ($isStraight && $isFlush) return ['type' => self::TYPE_STRAIGHT_FLUSH, 'rank' => $values];
            
            $four = array_search(4, $valueCounts);
            if ($four) return ['type' => self::TYPE_FOUR_OF_A_KIND, 'rank' => [$four]];

            $three = array_search(3, $valueCounts);
            $pair = array_search(2, $valueCounts);
            if ($three && $pair) return ['type' => self::TYPE_FULL_HOUSE, 'rank' => [$three, $pair]];

            if ($isFlush) return ['type' => self::TYPE_FLUSH, 'rank' => $values];
            if ($isStraight) return ['type' => self::TYPE_STRAIGHT, 'rank' => $values];
        }

        // 3张或5张牌都可能出现的牌型
        if ($count === 3) {
            $three = array_search(3, $valueCounts);
             if ($three) return ['type' => self::TYPE_THREE_OF_A_KIND, 'rank' => [$three]];
        }
        
        // 两对 (仅5张牌)
        if ($count === 5) {
            $pairs = array_keys($valueCounts, 2);
            if (count($pairs) === 2) {
                rsort($pairs);
                $single = array_search(1, $valueCounts);
                return ['type' => self::TYPE_TWO_PAIR, 'rank' => [$pairs[0], $pairs[1], $single]];
            }
        }

        // 一对
        $pairValue = array_search(2, $valueCounts);
        if ($pairValue) {
            $kickers = [];
            foreach($values as $v) if($v !== $pairValue) $kickers[] = $v;
            return ['type' => self::TYPE_PAIR, 'rank' => array_merge([$pairValue], $kickers)];
        }

        // 高牌
        return ['type' => self::TYPE_HIGH_CARD, 'rank' => $values];
    }
    
    /**
     * 比较两手牌的大小
     * @return int 1 if handA > handB, -1 if handA < handB, 0 if equal
     */
    public function compareHands(array $handA, array $handB) {
        $typeA = $this->getHandType($handA);
        $typeB = $this->getHandType($handB);

        if ($typeA['type'] !== $typeB['type']) {
            return ($typeA['type'] > $typeB['type']) ? 1 : -1;
        }
        
        // 牌型相同，比较牌阶
        for ($i = 0; $i < count($typeA['rank']); $i++) {
            if ($typeA['rank'][$i] !== $typeB['rank'][$i]) {
                return ($typeA['rank'][$i] > $typeB['rank'][$i]) ? 1 : -1;
            }
        }
        return 0; // 完全相同
    }

    /**
     * 检查玩家的三墩牌是否“倒水”
     */
    public function isFoul(array $front, array $middle, array $back): bool {
        if ($this->compareHands($front, $middle) > 0) return true;
        if ($this->compareHands($middle, $back) > 0) return true;
        return false;
    }
}
?>
