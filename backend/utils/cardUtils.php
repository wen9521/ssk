<?php
// backend/utils/cardUtils.php
// 描述: 提供与扑克牌相关的工具函数，如创建、洗牌和发牌。

/**
 * 创建一副标准的52张扑克牌。
 * 每张牌是一个代表其资源名称的字符串，例如 "ace_of_spades"。
 *
 * @return array 一副有序的扑克牌。
 */
function createDeck() {
    $suits = ['clubs', 'diamonds', 'hearts', 'spades'];
    $ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace'];
    $deck = [];

    foreach ($suits as $suit) {
        foreach ($ranks as $rank) {
            $deck[] = "{$rank}_of_{$suit}";
        }
    }
    return $deck;
}

/**
 * 洗牌并为一组玩家发牌 (十三水规则)。
 *
 * @param array $playerIds 玩家ID的数组。目前强制要求为4个玩家。
 * @return array 一个关联数组，键是玩家ID，值是该玩家分到的13张手牌数组。
 * @throws Exception 如果玩家数量不是4，则抛出异常。
 */
function dealCardsForPlayers(array $playerIds) {
    if (count($playerIds) !== 4) {
        throw new Exception("发牌失败: 玩家数量必须为4。");
    }

    $deck = createDeck();
    shuffle($deck); // 内置的 shuffle 函数可以高效地打乱数组顺序

    $hands = array_fill_keys($playerIds, []);
    $playerIndex = 0;

    // 轮流为每位玩家发牌，直到发完所有52张牌
    foreach ($deck as $card) {
        $currentPlayerId = $playerIds[$playerIndex];
        $hands[$currentPlayerId][] = $card;
        
        // 移向下一位玩家
        $playerIndex = ($playerIndex + 1) % 4;
    }

    return $hands;
}
