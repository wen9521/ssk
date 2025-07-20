// frontend/src/game-logic/thirteen-water-rules.js

// 辅助函数：将牌按大小排序
function sortCards(cards) {
    const rankOrder = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace'];
    return cards.slice().sort((a, b) => {
        return rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank);
    });
}

// 辅助函数：计算牌点出现的次数
function getRankCounts(hand) {
    const counts = {};
    for (const card of hand) {
        counts[card.rank] = (counts[card.rank] || 0) + 1;
    }
    return counts;
}

// 辅助函数：获取牌点的大小值
function getRankValue(rank) {
    const rankOrder = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace', 'black_joker', 'red_joker'];
    return rankOrder.indexOf(rank);
}

// 牌型判断函数

// 判断是否是对子
export function isPair(hand) {
    if (hand.length !== 2) return false; 
    return hand[0].rank === hand[1].rank;
}

// 判断是否是三条
export function isThreeOfAKind(hand) {
    if (hand.length !== 3) return false; 
    const counts = getRankCounts(hand);
    return Object.values(counts).some(count => count === 3);
}

// 判断是否是顺子 (考虑A23等特殊情况)
export function isStraight(hand) {
    if (hand.length < 5) return false; 
    const sortedHand = sortCards(hand);
    const rankOrder = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace'];

    const ranks = sortedHand.map(card => card.rank);
    const isA2345 = JSON.stringify(ranks) === JSON.stringify(['2', '3', '4', '5', 'ace']);

    if (isA2345) return true; 

    const rankCounts = getRankCounts(sortedHand);
    if (Object.values(rankCounts).some(count => count > 1)) {
        return false;
    }

    for (let i = 0; i < sortedHand.length - 1; i++) {
        if (rankOrder.indexOf(sortedHand[i + 1].rank) !== rankOrder.indexOf(sortedHand[i].rank) + 1) {
            return false;
        }
    }
    return true;
}

// 判断是否是同花
export function isFlush(hand) {
    if (hand.length < 5) return false; 
    const firstSuit = hand[0].suit;
    for (let i = 1; i < hand.length; i++) {
        if (hand[i].suit !== firstSuit) {
            return false;
        }
    }
    return true;
}

// 判断是否是两对
export function isTwoPair(hand) {
    if (hand.length !== 5) return false; 
    const counts = getRankCounts(hand);
    const pairs = Object.values(counts).filter(count => count === 2);
    return pairs.length === 2; 
}

// 判断是否是葫芦 (三条带一对)
export function isFullHouse(hand) {
    if (hand.length !== 5) return false; 
    const counts = getRankCounts(hand);
    const hasThree = Object.values(counts).some(count => count === 3);
    const hasPair = Object.values(counts).some(count => count === 2);
    return hasThree && hasPair;
}

// 判断是否是四条
export function isFourOfAKind(hand) {
    if (hand.length !== 5) return false; 
    const counts = getRankCounts(hand);
    return Object.values(counts).some(count => count === 4);
}

// 判断是否是同花顺
export function isStraightFlush(hand) {
    if (hand.length < 5) return false; 
    return isStraight(hand) && isFlush(hand);
}

// 判断是否是五同 (考虑大小王)
export function isFiveOfAKind(hand) {
    if (hand.length !== 5) return false; 
    const counts = getRankCounts(hand);
    const hasJoker = (counts['black_joker'] || 0) + (counts['red_joker'] || 0) > 0;

    if (hasJoker) {
        const nonJokerCards = hand.filter(card => card.rank !== 'black_joker' && card.rank !== 'red_joker');
        if (nonJokerCards.length === 4) {
            const nonJokerCounts = getRankCounts(nonJokerCards);
            return Object.values(nonJokerCounts).some(count => count === 4);
        } else if (nonJokerCards.length === 3) {
            const nonJokerCounts = getRankCounts(nonJokerCards);
            return Object.values(nonJokerCounts).some(count => count === 3);
        } else if (nonJokerCards.length === 2) {
            const nonJokerCounts = getRankCounts(nonJokerCards);
            return Object.values(nonJokerCounts).some(count => count === 2);
        } else if (nonJokerCards.length === 1) {
            return true;
        }

    } else {
        return Object.values(counts).some(count => count === 5);
    }

    return false;
}

// 判断是否是三同花顺
export function isThreeStraightFlush(hands) {
    return hands.front.length === 3 && hands.middle.length === 5 && hands.back.length === 5 &&
           isStraightFlush(hands.front) && isStraightFlush(hands.middle) && isStraightFlush(hands.back);
}

// 判断是否是三分天下 (三个四条)
export function isThreeFourOfAKind(hands) {
    const allCards = [...hands.front, ...hands.middle, ...hands.back];
    if (allCards.length !== 13) return false;

    const counts = getRankCounts(allCards);
    const fourOfAKindRanks = Object.keys(counts).filter(rank => counts[rank] === 4);

    return fourOfAKindRanks.length === 3; 
}

// 判断是否是四套三条 (四个三条)
export function isFourThreeOfAKind(hands) {
    const allCards = [...hands.front, ...hands.middle, ...hands.back];
    if (allCards.length !== 13) return false;

    const counts = getRankCounts(allCards);
    const threeOfAKindRanks = Object.keys(counts).filter(rank => counts[rank] === 3);

    return threeOfAKindRanks.length === 4;
}

// 判断是否是六对半 (六个对子加一张单牌)
export function isSixPairsAndASingle(hands) { 
    const allCards = [...hands.front, ...hands.middle, ...hands.back];
    if (allCards.length !== 13) return false;

    const counts = getRankCounts(allCards);
    const pairs = Object.values(counts).filter(count => count === 2);
    const singles = Object.values(counts).filter(count => count === 1);

    return pairs.length === 6 && singles.length === 1;
}

// 判断是否是五对三条 (五个对子加一个三条)
export function isFivePairsAndThreeOfAKind(hands) {
     const allCards = [...hands.front, ...hands.middle, ...hands.back];
    if (allCards.length !== 13) return false;

    const counts = getRankCounts(allCards);
    const pairs = Object.values(counts).filter(count => count === 2);
    const threes = Object.values(counts).filter(count => count === 3);

    return pairs.length === 5 && threes.length === 1;
}

// 判断是否是凑一色 (全部是红色牌或全部是黑色牌)
export function isFlushColor(hands) {
     const allCards = [...hands.front, ...hands.middle, ...hands.back];
     if (allCards.length !== 13) return false;

     const isRedFlush = allCards.every(card => card.suit === 'hearts' || card.suit === 'diamonds' || card.suit === 'red_joker');
     const isBlackFlush = allCards.every(card => card.suit === 'clubs' || card.suit === 'spades' || card.suit === 'black_joker');

     return isRedFlush || isBlackFlush;
}

// 判断是否是全大 (所有牌都在8点或以上)
export function isAllBig(hands) {
    const allCards = [...hands.front, ...hands.middle, ...hands.back];
    if (allCards.length !== 13) return false;

    const bigRanks = ['8', '9', '10', 'jack', 'queen', 'king', 'ace']; // 不包含大小王
    return allCards.every(card => getRankValue(card.rank) >= getRankValue('8') || card.rank === 'black_joker' || card.rank === 'red_joker');
}

// 判断是否是全小 (所有牌都在8点以下)
export function isAllSmall(hands) {
     const allCards = [...hands.front, ...hands.middle, ...hands.back];
    if (allCards.length !== 13) return false;

    const smallRanks = ['2', '3', '4', '5', '6', '7'];
     return allCards.every(card => smallRanks.includes(card.rank));
}

// 判断是否是一条龙 (A到K的顺子)
export function isDragon(hands) {
    const allCards = [...hands.front, ...hands.middle, ...hands.back];
    if (allCards.length !== 13) return false;

    const sortedCards = sortCards(allCards);
    const rankOrder = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace'];

     for (let i = 0; i < sortedCards.length - 1; i++) {
        if (rankOrder.indexOf(sortedCards[i + 1].rank) !== rankOrder.indexOf(sortedCards[i].rank) + 1) {
            return false;
        }
    }
    return true;
}

// 判断是否是至尊清龙 (十三张不同花色的A到K的顺子)
export function isSupremeDragon(hands) {
    const allCards = [...hands.front, ...hands.middle, ...hands.back];
    if (allCards.length !== 13) return false;

    const sortedCards = sortCards(allCards);
    const rankOrder = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace'];

    // 检查是否是A到K的顺子
    for (let i = 0; i < sortedCards.length; i++) {
        if (getRankValue(sortedCards[i].rank) !== getRankValue(rankOrder[i])) {
            return false;
        }
    }

    // 检查花色是否都不同
    const suits = new Set(allCards.map(card => card.suit));
    return suits.size === 13; // 需要13种不同的花色 (实际上只有4种花色，这个判断是错误的)
    // 至尊清龙应该是不同花色的A到K，所以只需要检查是不是A到K的顺子，并且没有同花色的牌点重复
    // 修正判断逻辑：检查是否是A到K的顺子，并且每个牌点只有一个花色
     const suitCounts = {};
     for(const card of allCards) {
         suitCounts[card.rank] = (suitCounts[card.rank] || 0) + 1;
     }
     return Object.values(suitCounts).every(count => count === 1) && isDragon(hands); // 检查每个牌点数量是1且是一条龙
}

// 判断是否是十二皇族 (任意十二张人头牌)
export function isTwelveRoyals(hands) {
    const allCards = [...hands.front, ...hands.middle, ...hands.back];
    if (allCards.length !== 13) return false;

    const royalRanks = ['jack', 'queen', 'king', 'ace']; // 皇族牌点 (通常包含A)
    const royalCards = allCards.filter(card => royalRanks.includes(card.rank));

    return royalCards.length === 12; // 必须有12张皇族牌
}

// 判断是否是三同花 (前中后三墩都是同花)
export function isThreeFlush(hands) {
    return hands.front.length === 3 && hands.middle.length === 5 && hands.back.length === 5 &&
           isFlush(hands.front) && isFlush(hands.middle) && isFlush(hands.back);
}

// 判断是否是三顺子 (前中后三墩都是顺子)
export function isThreeStraight(hands) {
    return hands.front.length === 3 && hands.middle.length === 5 && hands.back.length === 5 &&
           isStraight(hands.front) && isStraight(hands.middle) && isStraight(hands.back);
}

// 判断是否是十三张 (同花顺>四条>葫芦>...)
export function isThirteenCards(hands) {
    const allCards = [...hands.front, ...hands.middle, ...hands.back];
    if (allCards.length !== 13) return false;

    // 按优先级从高到低判断十三张牌型
    if (isSupremeDragon(hands)) return true; // 至尊清龙最高
    if (isThreeStraightFlush(hands)) return true;
    if (isThreeFourOfAKind(hands)) return true; 
    if (isFourThreeOfAKind(hands)) return true;
    if (isSixPairsAndASingle(hands)) return true;
    if (isFivePairsAndThreeOfAKind(hands)) return true;
    if (isFlushColor(hands)) return true;
    if (isAllBig(hands)) return true;
    if (isAllSmall(hands)) return true;
    if (isDragon(hands)) return true; // 普通一条龙
    if (isTwelveRoyals(hands)) return true; // 十二皇族
     if (isThreeFlush(hands)) return true; // 三同花
     if (isThreeStraight(hands)) return true; // 三顺子
    // TODO: 添加其他十三张牌型的判断

    return false;
}

// 计算特殊牌型的得分倍数
function getSpecialHandMultiplier(hands) {
     // 按优先级从高到低返回倍数
    if (isSupremeDragon(hands)) return 26; // 至尊清龙示例倍数
    if (isThreeStraightFlush(hands)) return 20; 
    if (isThreeFourOfAKind(hands)) return 16; 
    if (isFourThreeOfAKind(hands)) return 13; 
    if (isSixPairsAndASingle(hands)) return 6; 
    if (isFivePairsAndThreeOfAKind(hands)) return 5; 
    if (isFlushColor(hands)) return 4; 
    if (isAllBig(hands)) return 3; 
    if (isAllSmall(hands)) return 3; 
    if (isDragon(hands)) return 10; 
    if (isTwelveRoyals(hands)) return 12; // 十二皇族示例倍数
    if (isThreeFlush(hands)) return 3; // 三同花示例倍数
    if (isThreeStraight(hands)) return 3; // 三顺子示例倍数

    return 0; 
}

// 计算两个玩家之间的得分
// player1Hands: { front: [], middle: [], back: [] }
// player2Hands: { front: [], middle: [], back: [] }
// 返回值: player1 相对于 player2 的得分
export function calculateScore(player1Hands, player2Hands) {
    let score = 0;

    // 检查特殊牌型
    const player1SpecialMultiplier = getSpecialHandMultiplier(player1Hands);
    const player2SpecialMultiplier = getSpecialHandMultiplier(player2Hands);

    if (player1SpecialMultiplier > 0 || player2SpecialMultiplier > 0) {
        if (player1SpecialMultiplier > player2SpecialMultiplier) {
            return player1SpecialMultiplier; 
        } else if (player2SpecialMultiplier > player1SpecialMultiplier) {
            return -player2SpecialMultiplier; 
        } else {
            // 双方有相同特殊牌型，这里简化处理为平局
            return 0;
        }
    }

    // 如果没有特殊牌型，按墩计算得分
    const frontComparison = compareHands(player1Hands.front, player2Hands.front);
    if (frontComparison > 0) {
        score += 1; 
    } else if (frontComparison < 0) {
        score -= 1; 
    }

    const middleComparison = compareHands(player1Hands.middle, player2Hands.middle);
    if (middleComparison > 0) {
        score += 2; 
    } else if (middleComparison < 0) {
        score -= 2; 
    }

    const backComparison = compareHands(player1Hands.back, player2Hands.back);
    if (backComparison > 0) {
        score += 1; 
    } else if (backComparison < 0) {
        score -= 1; 
    }

    return score;
}

// 简易AI：尝试为手牌找到一个合理的前、中、后墩组合
export function simpleAI(cards) {
    const sortedCards = sortCards(cards); 
    let remainingCards = [...sortedCards];

    const front = [];
    const middle = [];
    const back = [];

    // 尝试组成牌型并分配到墩，优先考虑大的牌型和后面的墩

    // 尝试在后墩找同花顺 (5张)
    let foundBack = false;
    for (let i = 0; i <= remainingCards.length - 5; i++) {
        const potentialHand = remainingCards.slice(i, i + 5);
        if (isStraightFlush(potentialHand)) {
            back.push(...potentialHand);
            remainingCards.splice(i, 5);
            foundBack = true;
            break;
        }
    }

    // 尝试在后墩找四条 (5张)
     if (!foundBack) { 
         for (let i = 0; i <= remainingCards.length - 5; i++) {
            const potentialHand = remainingCards.slice(i, i + 5);
            if (isFourOfAKind(potentialHand)) {
                back.push(...potentialHand);
                remainingCards.splice(i, 5);
                foundBack = true;
                break;
            }
        }
     }

    // 尝试在中墩找葫芦 (5张)
    let foundMiddle = false;
    for (let i = 0; i <= remainingCards.length - 5; i++) {
        const potentialHand = remainingCards.slice(i, i + 5);
        if (isFullHouse(potentialHand)) {
            middle.push(...potentialHand);
            remainingCards.splice(i, 5);
            foundMiddle = true;
            break;
        }
    }

    // 尝试在后墩找同花 (5张)
     if (!foundBack) { 
        for (let i = 0; i <= remainingCards.length - 5; i++) {
            const potentialHand = remainingCards.slice(i, i + 5);
            if (isFlush(potentialHand)) {
                back.push(...potentialHand);
                remainingCards.splice(i, 5);
                foundBack = true;
                break;
            }
        }
     }

    // 尝试在中墩找顺子 (5张)
    if (!foundMiddle) { 
         for (let i = 0; i <= remainingCards.length - 5; i++) {
            const potentialHand = remainingCards.slice(i, i + 5);
            if (isStraight(potentialHand)) {
                middle.push(...potentialHand);
                remainingCards.splice(i, 5);
                foundMiddle = true;
                break;
            }
        }
    }

    // 尝试在前墩找三条 (3张)
    let foundFront = false;
    for (let i = 0; i <= remainingCards.length - 3; i++) {
        const potentialHand = remainingCards.slice(i, i + 3);
        if (isThreeOfAKind(potentialHand)) {
            front.push(...potentialHand);
            remainingCards.splice(i, 3);
            foundFront = true;
            break;
        }
    }

     // 尝试在前墩找对子 (2张) -- 前墩只有3张牌，所以不能直接找对子+单张，需要组合
     if (!foundFront && remainingCards.length >= 2) {
         // 遍历所有可能的两张牌组合，看看是否是对子
         for(let i = 0; i <= remainingCards.length - 2; i++) {
             const potentialPair = remainingCards.slice(i, i + 2);
             if (isPair(potentialPair)) {
                 front.push(...potentialPair);
                 remainingCards.splice(i, 2);
                 foundFront = true;
                 break;
             }
         }
          // 如果找到了对子，再从剩余牌中找一张作为前墩的第三张牌
          if (foundFront && remainingCards.length > 0) {
              front.push(remainingCards.pop());
          }
     }

    // 将剩余的牌分配到未满的墩
    while (back.length < 5 && remainingCards.length > 0) {
        back.push(remainingCards.pop());
    }
    while (middle.length < 5 && remainingCards.length > 0) {
        middle.push(remainingCards.pop());
    }
    while (front.length < 3 && remainingCards.length > 0) {
         front.push(remainingCards.pop());
    }

    // 确保墩的牌数正确，如果不正确，进行随机分配
     if (front.length !== 3 || middle.length !== 5 || back.length !== 5) {
         const shuffledOriginal = shuffleDeck(cards);
         return {
             front: shuffledOriginal.slice(0,3),
             middle: shuffledOriginal.slice(3,8),
             back: shuffledOriginal.slice(8,13),
         };
     }

    return { front, middle, back };
}
