<?php
// backend/utils/scoring.php

/**
 * 检查一个牌墩是否倒水 (此为简化逻辑)。
 * 真实场景下需要复杂的牌力比较。
 * @param array $dun 包含 head, middle, tail 的牌墩
 * @return bool 是否倒水
 */
function is_foul($dun) {
    // 这是一个非常简化的示例
    // 真实的检查会复杂得多
    return false; 
}

/**
 * 计算所有玩家的最终得分。
 * 这是一个占位函数, 目前返回随机分数以便测试流程。
 * 之后可以替换为真实的十三水计分算法。
 *
 * @param array $all_player_duns 一个包含所有玩家牌墩的数组
 *   [
 *     ['name' => '玩家1', 'dun' => ['head'=>[], 'middle'=>[], 'tail'=>[]]],
 *     ['name' => '玩家2', 'dun' => ['head'=>[], 'middle'=>[], 'tail'=>[]]]
 *   ]
 * @return array 每个玩家最终得分的数组, 顺序与输入一致
 */
function calculate_all_scores($all_player_duns) {
    $scores = [];
    foreach ($all_player_duns as $player_dun) {
        // 占位逻辑: 返回一个 -10 到 +10 的随机分数
        $scores[] = rand(-10, 10);
    }
    return $scores;
}
?>
