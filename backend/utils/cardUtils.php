<?php
// backend/utils/cardUtils.php

/**
 * 创建一副标准的52张扑克牌。
 * 卡牌格式为 "花色+点数", 例如 'SA' (黑桃A), 'HT' (红桃10), 'C2' (梅花2)。
 * @return array 一副扑克牌
 */
function create_deck() {
    $suits = ['S', 'H', 'D', 'C']; // Spades, Hearts, Diamonds, Clubs
    $ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
    $deck = [];
    foreach ($suits as $suit) {
        foreach ($ranks as $rank) {
            $deck[] = $suit . $rank;
        }
    }
    return $deck;
}

/**
 * 洗牌并为指定数量的玩家发牌。
 * @param int $num_players 玩家数量
 * @return array 每个玩家的手牌数组
 */
function deal_hands($num_players) {
    if ($num_players <= 0 || $num_players > 4) {
        return [];
    }

    $deck = create_deck();
    shuffle($deck); // 洗牌

    $hands = array_fill(0, $num_players, []);
    $deck_index = 0;

    for ($i = 0; $i < 13; $i++) {
        for ($j = 0; $j < $num_players; $j++) {
            $hands[$j][] = $deck[$deck_index++];
        }
    }

    return $hands;
}
?>
