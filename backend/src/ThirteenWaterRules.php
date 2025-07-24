<?php
namespace MyApp;

class ThirteenWaterRules {

    const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
    const SUITS = ['clubs', 'diamonds', 'hearts', 'spades'];

    private static $handTypeRank = [
        'straight flush' => 9,
        'four of a kind' => 8,
        'full house' => 7,
        'flush' => 6,
        'straight' => 5,
        'three of a kind' => 4,
        'two pair' => 3,
        'pair' => 2,
        'high card' => 1,
    ];

    public static function getCardValue($card) {
        return array_search($card->rank, self::RANKS);
    }

    public static function sortCards(array $cards) {
        usort($cards, function($a, $b) {
            return self::getCardValue($a) - self::getCardValue($b);
        });
        return $cards;
    }

    private static function isFlush(array $hand) {
        if (empty($hand)) return false;
        $suit = $hand[0]->suit;
        foreach ($hand as $card) {
            if ($card->suit !== $suit) {
                return false;
            }
        }
        return true;
    }

    private static function isStraight(array $hand) {
        if (count($hand) < 5) return false;
        $sortedHand = self::sortCards($hand);
        for ($i = 0; $i < count($sortedHand) - 1; $i++) {
            if (self::getCardValue($sortedHand[$i + 1]) - self::getCardValue($sortedHand[$i]) !== 1) {
                // Handle Ace-low straight (A, 2, 3, 4, 5)
                if (
                    $sortedHand[0]->rank === '2' && $sortedHand[1]->rank === '3' &&
                    $sortedHand[2]->rank === '4' && $sortedHand[3]->rank === '5' &&
                    $sortedHand[4]->rank === 'A' && count($sortedHand) === 5
                ) {
                    return true;
                }
                return false;
            }
        }
        return true;
    }

    private static function getRankCounts(array $hand) {
        $counts = [];
        foreach ($hand as $card) {
            $counts[$card->rank] = ($counts[$card->rank] ?? 0) + 1;
        }
        return $counts;
    }

    public static function getHandType(array $hand) {
        if (empty($hand)) return 'high card';

        $counts = self::getRankCounts($hand);
        $values = array_values($counts);
        $uniqueRanks = count($counts);
        $hasFour = in_array(4, $values);
        $hasThree = in_array(3, $values);
        $numPairs = count(array_filter($values, function($v) { return $v === 2; }));
        $flush = self::isFlush($hand);
        $straight = self::isStraight($hand);

        if ($flush && $straight) return 'straight flush';
        if ($hasFour) return 'four of a kind';
        if ($hasThree && $numPairs === 1) return 'full house';
        if ($flush) return 'flush';
        if ($straight) return 'straight';
        if ($hasThree) return 'three of a kind';
        if ($numPairs === 2) return 'two pair';
        if ($numPairs === 1) return 'pair';

        return 'high card';
    }

    public static function compareHands(array $hand1, array $hand2) {
        $type1 = self::getHandType($hand1);
        $type2 = self::getHandType($hand2);

        // First, compare by hand type rank
        if (self::$handTypeRank[$type1] > self::$handTypeRank[$type2]) return 1;
        if (self::$handTypeRank[$type1] < self::$handTypeRank[$type2]) return -1;

        // If hand types are the same, compare by card values
        $sortedHand1 = self::sortCards($hand1);
        $sortedHand2 = self::sortCards($hand2);

        switch ($type1) {
            case 'high card':
            case 'flush':
            case 'straight':
            case 'straight flush':
                // Compare highest card first, then next highest, etc.
                for ($i = count($sortedHand1) - 1; $i >= 0; $i--) {
                    if (self::getCardValue($sortedHand1[$i]) > self::getCardValue($sortedHand2[$i])) return 1;
                    if (self::getCardValue($sortedHand1[$i]) < self::getCardValue($sortedHand2[$i])) return -1;
                }
                return 0;
            case 'pair':
                return self::comparePair($hand1, $hand2);
            case 'two pair':
                return self::compareTwoPair($hand1, $hand2);
            case 'three of a kind':
                return self::compareThreeOfAKind($hand1, $hand2);
            case 'full house':
                return self::compareFullHouse($hand1, $hand2);
            case 'four of a kind':
                return self::compareFourOfAKind($hand1, $hand2);
            default:
                return 0;
        }
    }

    private static function comparePair(array $hand1, array $hand2) {
        $counts1 = self::getRankCounts($hand1);
        $counts2 = self::getRankCounts($hand2);

        $pairRank1 = array_search(array_keys(array_filter($counts1, function($v) { return $v === 2; }))[0], self::RANKS);
        $pairRank2 = array_search(array_keys(array_filter($counts2, function($v) { return $v === 2; }))[0], self::RANKS);

        if ($pairRank1 > $pairRank2) return 1;
        if ($pairRank1 < $pairRank2) return -1;

        // If pairs are same, compare kickers
        $kickers1 = self::sortCards(array_filter($hand1, function($card) use ($counts1) { return $counts1[$card->rank] === 1; }));
        $kickers2 = self::sortCards(array_filter($hand2, function($card) use ($counts2) { return $counts2[$card->rank] === 1; }));

        for ($i = count($kickers1) - 1; $i >= 0; $i--) {
            if (self::getCardValue($kickers1[$i]) > self::getCardValue($kickers2[$i])) return 1;
            if (self::getCardValue($kickers1[$i]) < self::getCardValue($kickers2[$i])) return -1;
        }
        return 0;
    }

    private static function compareTwoPair(array $hand1, array $hand2) {
        $counts1 = self::getRankCounts($hand1);
        $counts2 = self::getRankCounts($hand2);

        $pairs1 = array_map(function($rank) { return array_search($rank, self::RANKS); }, array_keys(array_filter($counts1, function($v) { return $v === 2; })));
        rsort($pairs1);
        $pairs2 = array_map(function($rank) { return array_search($rank, self::RANKS); }, array_keys(array_filter($counts2, function($v) { return $v === 2; })));
        rsort($pairs2);

        // Compare higher pair
        if ($pairs1[0] > $pairs2[0]) return 1;
        if ($pairs1[0] < $pairs2[0]) return -1;

        // Compare lower pair
        if ($pairs1[1] > $pairs2[1]) return 1;
        if ($pairs1[1] < $pairs2[1]) return -1;

        // Compare kicker
        $kicker1 = self::sortCards(array_filter($hand1, function($card) use ($counts1) { return $counts1[$card->rank] === 1; }))[0];
        $kicker2 = self::sortCards(array_filter($hand2, function($card) use ($counts2) { return $counts2[$card->rank] === 1; }))[0];

        if (self::getCardValue($kicker1) > self::getCardValue($kicker2)) return 1;
        if (self::getCardValue($kicker1) < self::getCardValue($kicker2)) return -1;
        
        return 0;
    }

    private static function compareThreeOfAKind(array $hand1, array $hand2) {
        $counts1 = self::getRankCounts($hand1);
        $counts2 = self::getRankCounts($hand2);

        $threeRank1 = array_search(array_keys(array_filter($counts1, function($v) { return $v === 3; }))[0], self::RANKS);
        $threeRank2 = array_search(array_keys(array_filter($counts2, function($v) { return $v === 3; }))[0], self::RANKS);

        if ($threeRank1 > $threeRank2) return 1;
        if ($threeRank1 < $threeRank2) return -1;

        // Compare kickers
        $kickers1 = self::sortCards(array_filter($hand1, function($card) use ($counts1) { return $counts1[$card->rank] === 1; }));
        $kickers2 = self::sortCards(array_filter($hand2, function($card) use ($counts2) { return $counts2[$card->rank] === 1; }));

        for ($i = count($kickers1) - 1; $i >= 0; $i--) {
            if (self::getCardValue($kickers1[$i]) > self::getCardValue($kickers2[$i])) return 1;
            if (self::getCardValue($kickers1[$i]) < self::getCardValue($kickers2[$i])) return -1;
        }

        return 0;
    }

    private static function compareFullHouse(array $hand1, array $hand2) {
        $counts1 = self::getRankCounts($hand1);
        $counts2 = self::getRankCounts($hand2);

        $threeRank1 = array_search(array_keys(array_filter($counts1, function($v) { return $v === 3; }))[0], self::RANKS);
        $threeRank2 = array_search(array_keys(array_filter($counts2, function($v) { return $v === 3; }))[0], self::RANKS);

        if ($threeRank1 > $threeRank2) return 1;
        if ($threeRank1 < $threeRank2) return -1;

        $pairRank1 = array_search(array_keys(array_filter($counts1, function($v) { return $v === 2; }))[0], self::RANKS);
        $pairRank2 = array_search(array_keys(array_filter($counts2, function($v) { return $v === 2; }))[0], self::RANKS);

        if ($pairRank1 > $pairRank2) return 1;
        if ($pairRank1 < $pairRank2) return -1;

        return 0;
    }

    private static function compareFourOfAKind(array $hand1, array $hand2) {
        $counts1 = self::getRankCounts($hand1);
        $counts2 = self::getRankCounts($hand2);

        $fourRank1 = array_search(array_keys(array_filter($counts1, function($v) { return $v === 4; }))[0], self::RANKS);
        $fourRank2 = array_search(array_keys(array_filter($counts2, function($v) { return $v === 4; }))[0], self::RANKS);

        if ($fourRank1 > $fourRank2) return 1;
        if ($fourRank1 < $fourRank2) return -1;

        // Compare kicker
        $kicker1 = self::sortCards(array_filter($hand1, function($card) use ($counts1) { return $counts1[$card->rank] === 1; }))[0];
        $kicker2 = self::sortCards(array_filter($hand2, function($card) use ($counts2) { return $counts2[$card->rank] === 1; }))[0];

        if (self::getCardValue($kicker1) > self::getCardValue($kicker2)) return 1;
        if (self::getCardValue($kicker1) < self::getCardValue($kicker2)) return -1;

        return 0;
    }

}
