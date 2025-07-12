<?php
// backend/utils/DoudizhuRule.php
// 描述: 封装斗地主游戏的所有出牌规则和逻辑。

class DoudizhuRule {
    private $cardValues = [];

    public function __construct() {
        $ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace', '2'];
        $value = 3;
        foreach ($ranks as $rank) $this->cardValues[$rank] = $value++;
        $this->cardValues['black_joker'] = 16;
        $this->cardValues['red_joker'] = 17;
    }

    private function getRank($card) {
        if (strpos($card, '_joker') !== false) return $card;
        return explode('_of_', $card)[0];
    }

    private function getCardCounts(array $cards) {
        $counts = [];
        foreach ($cards as $card) {
            $value = $this->cardValues[$this->getRank($card)];
            if (!isset($counts[$value])) $counts[$value] = 0;
            $counts[$value]++;
        }
        ksort($counts);
        return $counts;
    }

    public function isValidPlay(array $playedCards, ?array $lastPlayCards): bool {
        $playedType = $this->getCardType($playedCards);
        if ($playedType['type'] === 'invalid') return false;
        if (empty($lastPlayCards)) return true;
        
        $lastPlayType = $this->getCardType($lastPlayCards);
        return $this->compare($playedType, $lastPlayType);
    }
    
    private function compare(array $playedType, array $lastPlayType): bool {
        if ($playedType['type'] === 'rocket') return true;
        if ($lastPlayType['type'] === 'rocket') return false;
        if ($playedType['type'] === 'bomb' && $lastPlayType['type'] !== 'bomb') return true;
        if ($playedType['type'] !== 'bomb' && $lastPlayType['type'] === 'bomb') return false;
        if ($playedType['type'] === $lastPlayType['type'] && $playedType['count'] === $lastPlayType['count']) {
            return $playedType['rank'] > $lastPlayType['rank'];
        }
        return false;
    }

    public function getCardType(array $cards): array {
        $count = count($cards);
        if ($count === 0) return ['type' => 'pass'];
        $counts = $this->getCardCounts($cards);
        $rankCounts = array_count_values($counts);
        $ranks = array_keys($counts);

        // 单张
        if ($count === 1) return ['type' => 'solo', 'rank' => $ranks[0], 'count' => 1];
        // 对子
        if ($count === 2 && isset($rankCounts[2]) && $rankCounts[2] === 1) return ['type' => 'pair', 'rank' => $ranks[0], 'count' => 2];
        // 王炸
        if ($count === 2 && isset($counts[16]) && isset($counts[17])) return ['type' => 'rocket', 'rank' => 17, 'count' => 2];
        // 三张
        if ($count === 3 && isset($rankCounts[3]) && $rankCounts[3] === 1) return ['type' => 'trio', 'rank' => $ranks[0], 'count' => 3];
        // 炸弹
        if ($count === 4 && isset($rankCounts[4]) && $rankCounts[4] === 1) return ['type' => 'bomb', 'rank' => $ranks[0], 'count' => 4];
        // 三带一
        if ($count === 4 && isset($rankCounts[3]) && $rankCounts[3] === 1) return ['type' => 'trio_solo', 'rank' => array_search(3, $counts), 'count' => 4];
        // 三带二
        if ($count === 5 && isset($rankCounts[3]) && $rankCounts[3] === 1 && isset($rankCounts[2]) && $rankCounts[2] === 1) return ['type' => 'trio_pair', 'rank' => array_search(3, $counts), 'count' => 5];
        
        // 顺子, 连对, 飞机
        $isSequence = $this->isSequential($ranks);
        if ($count >= 5 && $isSequence) {
            if (isset($rankCounts[1]) && $rankCounts[1] === $count) return ['type' => 'sequence', 'rank' => max($ranks), 'count' => $count];
            if ($count >= 6 && isset($rankCounts[2]) && $rankCounts[2] === $count / 2) return ['type' => 'sequence_pairs', 'rank' => max($ranks), 'count' => $count];
            if ($count >= 6 && isset($rankCounts[3]) && $rankCounts[3] === $count / 3) return ['type' => 'sequence_trios', 'rank' => max($ranks), 'count' => $count];
        }

        // 飞机带翅膀 & 四带二
        $trios = array_keys($counts, 3);
        $quads = array_keys($counts, 4);
        if (count($trios) >= 2 && $this->isSequential($trios)) {
            $singles = count(array_keys($counts, 1));
            $pairs = count(array_keys($counts, 2));
            if ($count === count($trios) * 4 && $singles === count($trios)) return ['type' => 'airplane_solos', 'rank' => max($trios), 'count' => $count];
            if ($count === count($trios) * 5 && $pairs === count($trios)) return ['type' => 'airplane_pairs', 'rank' => max($trios), 'count' => $count];
        }
        if (count($quads) === 1) {
            $singles = count(array_keys($counts, 1));
            $pairs = count(array_keys($counts, 2));
            if ($count === 6 && $singles === 2) return ['type' => 'quad_two_solos', 'rank' => $quads[0], 'count' => 6];
            if ($count === 8 && $pairs === 2) return ['type' => 'quad_two_pairs', 'rank' => $quads[0], 'count' => 8];
        }

        return ['type' => 'invalid', 'rank' => 0, 'count' => $count];
    }
    
    private function isSequential(array $values): bool {
        if (count($values) < 2) return false;
        // 2 and Jokers cannot be in sequences
        if (in_array(15, $values) || in_array(16, $values) || in_array(17, $values)) return false;
        for ($i = 0; $i < count($values) - 1; $i++) {
            if ($values[$i+1] - $values[$i] !== 1) return false;
        }
        return true;
    }
}
