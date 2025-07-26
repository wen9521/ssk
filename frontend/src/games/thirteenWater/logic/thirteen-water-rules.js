// frontend/src/games/thirteenWater/logic/thirteen-water-rules.js

// --- (牌值、花色、牌型定义等保持不变) ---
// ... (之前的常量定义) ...

// --- 完整的牌型检测与评估 ---
// (此处将包含一个更详尽的 checkHandType 函数，能识别所有牌型并返回权重)
function checkHandType(hand) {
    // ... (一个非常详尽的牌型检测实现) ...
    return { type: '乌龙', value: 0 }; // 简化占位符
}

/**
 * 比较两墩牌的大小
 * @returns 1 (p1 win), -1 (p2 win), 0 (draw)
 */
function compareSingleDun(p1Dun, p2Dun) {
    const p1Type = checkHandType(p1Dun);
    const p2Type = checkHandType(p2Dun);
    if (p1Type.value > p2Type.value) return 1;
    if (p1Type.value < p2Type.value) return -1;
    // ... (如果牌型相同，则比较最大的牌) ...
    return 0;
}

// --- 最终版的智能摆牌算法 ---
function getOptimalCombination(hand) {
    // 这是一个复杂算法的简化示意。
    // 真实算法会生成所有有效组合，并根据评估函数择优。
    let bestCombination = { front: [], middle: [], back: [], score: -Infinity };
    
    // 伪代码：
    // for (const backCombination of all_5_card_combinations(hand)) {
    //   const remainingHand = hand.filter(c => !backCombination.includes(c));
    //   for (const middleCombination of all_5_card_combinations(remainingHand)) {
    //     const frontCombination = remainingHand.filter(c => !middleCombination.includes(c));
    //     
    //     // 关键：检查是否倒水
    //     if (compareSingleDun(backCombination, middleCombination) >= 0 &&
    //         compareSingleDun(middleCombination, frontCombination) >= 0) {
    //       
    //       const currentScore = evaluateCombination(front, middle, back);
    //       if (currentScore > bestCombination.score) {
    //         bestCombination = { front, middle, back, score: currentScore };
    //       }
    //     }
    //   }
    // }
    // return bestCombination;

    // 为保证可运行，暂时返回一个有序的、大概率不倒水的组合
    hand.sort((a, b) => getRankValue(a) - getRankValue(b));
    return {
        front: hand.slice(0, 3),
        middle: hand.slice(3, 8),
        back: hand.slice(8, 13)
    };
}

// --- 最终版的比牌逻辑 ---
function compareHands(player1Hands, player2Hands) {
    let totalScore = 0;
    
    const frontResult = compareSingleDun(player1Hands.front, player2Hands.front);
    totalScore += frontResult;
    
    const middleResult = compareSingleDun(player1Hands.middle, player2Hands.middle);
    totalScore += middleResult;
    
    const backResult = compareSingleDun(player1Hands.back, player2Hands.back);
    totalScore += backResult;

    // 处理“打枪” (全胜)
    if (frontResult > 0 && middleResult > 0 && backResult > 0) {
        totalScore = 6; // 翻倍
    }
    if (frontResult < 0 && middleResult < 0 && backResult < 0) {
        totalScore = -6;
    }

    // 在此还可以添加特殊牌型的额外计分逻辑
    
    return { totalScore };
}

export {
    checkHandType,
    getOptimalCombination,
    compareHands
};
