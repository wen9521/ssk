<?php
// backend/utils/DoudizhuCardUtils.php
// 描述: 提供斗地主游戏相关的卡牌工具函数。

/**
 * 创建一副包含大小王的54张斗地主扑克牌。
 * @return array 一副有序的扑克牌。
 */
function createDoudizhuDeck() {
    $suits = ['clubs', 'diamonds', 'hearts', 'spades'];
    $ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace', '2']; // 斗地主中，2是最大的牌
    $deck = [];

    foreach ($suits as $suit) {
        foreach ($ranks as $rank) {
            $deck[] = "{$rank}_of_{$suit}";
        }
    }
    
    // 添加大小王
    $deck[] = 'black_joker';
    $deck[] = 'red_joker';
    
    return $deck;
}

/**
 * 为斗地主游戏洗牌并发牌。
 *
 * @param array $playerIds 包含3个玩家ID的数组。
 * @return array 一个关联数组，包含 'hands' (玩家手牌) 和 'landlordCards' (底牌)。
 * @throws Exception 如果玩家数量不是3，则抛出异常。
 */
function dealCardsForDoudizhu(array $playerIds) {
    if (count($playerIds) !== 3) {
        throw new Exception("斗地主发牌失败: 玩家数量必须为3。");
    }

    $deck = createDoudizhuDeck();
    shuffle($deck);

    $hands = array_fill_keys($playerIds, []);
    
    // 为3个玩家每人发17张牌
    for ($i = 0; $i < 17; $i++) {
        foreach ($playerIds as $playerId) {
            $hands[$playerId][] = array_pop($deck);
        }
    }
    
    // 剩下的3张是底牌
    $landlordCards = $deck;

    return [
        'hands' => $hands,
        'landlordCards' => $landlordCards
    ];
}
