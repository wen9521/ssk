<?php
// backend/utils/cardUtils.php
// 描述: 提供与扑克牌相关的工具函数，如创建、洗牌和发牌。

/**
 * 创建一副标准的54张扑克牌（包含大小王）。
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
    
    // 添加大小王
    $deck[] = 'red_joker';
    $deck[] = 'black_joker';
    
    return $deck;
}

/**
 * 为斗地主游戏发牌。
 *
 * @param array $playerIds 玩家ID数组，应包含3个玩家。
 * @return array 包含玩家手牌和底牌的关联数组。
 * @throws Exception 如果玩家数量不是3，则抛出异常。
 */
function dealCardsForDoudizhu(array $playerIds) {
    if (count($playerIds) !== 3) {
        throw new Exception("发牌失败: 斗地主玩家数量必须为3。");
    }

    $deck = createDeck();
    shuffle($deck);

    $hands = array_fill_keys($playerIds, []);
    for ($i = 0; $i < 17; $i++) {
        foreach ($playerIds as $playerId) {
            $hands[$playerId][] = array_pop($deck);
        }
    }

    return [
        'hands' => $hands,
        'kitty' => $deck // 剩下的3张是底牌
    ];
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
    // 十三水不需要大小王
    $deck = array_filter($deck, function($card) {
        return $card !== 'red_joker' && $card !== 'black_joker';
    });
    shuffle($deck); 

    $hands = array_fill_keys($playerIds, []);
    $playerIndex = 0;

    // 轮流为每位玩家发牌，直到发完所有52张牌
    foreach ($deck as $card) {
        $currentPlayerId = $playerIds[$playerIndex];
        $hands[$currentPlayerId][] = $card;
        
        $playerIndex = ($playerIndex + 1) % 4;
    }

    return $hands;
}
