<?php
// backend/utils/BigTwoRule.php
// 描述: 封装锄大地（Big Two）游戏的所有出牌规则和逻辑。

class BigTwoRule {
    private $cardValues = [];
    private $suitValues = [];

    public function __construct() {
        // 锄大地的点数顺序: 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K, A, 2
        $ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace', '2'];
        $value = 3;
        foreach ($ranks as $rank) $this->cardValues[$rank] = $value++;

        // 花色顺序: 方块 < 梅花 < 红桃 < 黑桃
        $this->suitValues = ['diamonds' => 1, 'clubs' => 2, 'hearts' => 3, 'spades' => 4];
    }

    private function getCardInfo($card) {
        [$rank, $suit] = explode('_of_', $card);
        return [
            'rank' => $this->cardValues[$rank],
            'suit' => $this->suitValues[$suit],
            'card' => $card
        ];
    }
    
    // 主验证函数
    public function isValidPlay(array $playedCards, ?array $lastPlayCards): bool {
        $playedType = $this->getCardType($playedCards);
        if ($playedType['type'] === 'invalid') return false;
        if (empty($lastPlayCards)) return true;
        
        $lastPlayType = $this->getCardType($lastPlayCards);
        
        // 牌型不同，不能出
        if ($playedType['type'] !== $lastPlayType['type']) return false;
        // 牌数量不同，不能出
        if (count($playedCards) !== count($lastPlayCards)) return false;

        return $playedType['rank'] > $lastPlayType['rank'];
    }

    public function getCardType(array $cards): array {
        $count = count($cards);
        if ($count === 0) return ['type' => 'pass'];

        $infos = array_map([$this, 'getCardInfo'], $cards);
        // 按点数排序，点数相同按花色排序
        usort($infos, fn($a, $b) => $a['rank'] <=> $b['rank'] ?: $a['suit'] <=> $b['suit']);

        // 单张
        if ($count === 1) return ['type' => 'solo', 'rank' => $this->getCardRank($infos[0])];
        
        // 对子
        if ($count === 2 && $infos[0]['rank'] === $infos[1]['rank']) {
            return ['type' => 'pair', 'rank' => $this->getCardRank(end($infos))];
        }

        // 三条
        if ($count === 3 && $infos[0]['rank'] === $infos[1]['rank'] && $infos[1]['rank'] === $infos[2]['rank']) {
            return ['type' => 'trio', 'rank' => $this->getCardRank(end($infos))];
        }

        // 5张牌的牌型
        if ($count === 5) {
            $isFlush = count(array_unique(array_column($infos, 'suit'))) === 1;
            $isStraight = $this->isSequential($infos);
            
            $comboRank = $this->getCardRank(end($infos));

            // 同花顺
            if ($isFlush && $isStraight) return ['type' => 'straight_flush', 'rank' => $comboRank];
            // 金刚 (铁支)
            $rankCounts = array_count_values(array_column($infos, 'rank'));
            if (in_array(4, $rankCounts)) {
                $fourRank = array_search(4, $rankCounts);
                return ['type' => 'four_of_a_kind', 'rank' => $fourRank];
            }
            // 葫芦 (三带二)
            if (in_array(3, $rankCounts) && in_array(2, $rankCounts)) {
                $threeRank = array_search(3, $rankCounts);
                return ['type' => 'full_house', 'rank' => $threeRank];
            }
            // 同花
            if ($isFlush) return ['type' => 'flush', 'rank' => $comboRank];
            // 顺子
            if ($isStraight) return ['type' => 'straight', 'rank' => $comboRank];
        }

        return ['type' => 'invalid', 'rank' => 0];
    }

    private function getCardRank($cardInfo) {
        // 组合牌型的 rank 由点数和花色共同决定
        return $cardInfo['rank'] * 10 + $cardInfo['suit'];
    }

    private function isSequential(array $cardInfos): bool {
        // 处理特殊的 A,2,3,4,5 顺子
        $ranks = array_unique(array_column($cardInfos, 'rank'));
        if (count($ranks) !== 5) return false;
        sort($ranks);
        if ($ranks === [3, 4, 5, 13, 14]) return true; // A,2,3,4,5
        
        for ($i = 0; $i < count($ranks) - 1; $i++) {
            if ($ranks[$i+1] - $ranks[$i] !== 1) return false;
        }
        return true;
    }
}
