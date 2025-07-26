// frontend/src/game-logic/ai-logic.js

// This file contains the AI logic for the Thirteen Water game.

function cardValue(card) {
    const v = card.split('_')[0];
    if (v === 'ace') return 14;
    if (v === 'king') return 13;
    if (v === 'queen') return 12;
    if (v === 'jack') return 11;
    return parseInt(v, 10);
  }
  function cardSuit(card) {
    return card.split('_')[2];
  }
  function uniq(arr) { return [...new Set(arr)]; }
  function groupBy(arr, fn = x => x) {
    const g = {};
    arr.forEach(x => {
      const k = fn(x); g[k] = g[k] || []; g[k].push(x);
    });
    return g;
  }
  function getTotalValue(cards) {
    return cards.reduce((sum, c) => sum + cardValue(c), 0);
  }
  function combinations(arr, k) {
    let res = [];
    function comb(path, start) {
      if (path.length === k) return res.push(path);
      for (let i = start; i < arr.length; ++i) comb([...path, arr[i]], i + 1);
    }
    comb([], 0);
    return res;
  }
  function sortCardsForAI(cards) {
    return [...cards].sort((a, b) => cardValue(b) - cardValue(a) || cardSuit(b).localeCompare(cardSuit(a)));
  }
  
  // ==== 特殊牌型检测 ====
  function detectDragon(cards13) {
    const vals = uniq(cards13.map(cardValue));
    if (vals.length === 13) {
      const sorted = sortCardsForAI(cards13);
      return { head: sorted.slice(0, 3), middle: sorted.slice(3, 8), tail: sorted.slice(8, 13), type: '一条龙' };
    }
    return null;
  }
  function detectSixPairs(cards13) {
    const byVal = groupBy(cards13, cardValue);
    const pairs = Object.values(byVal).filter(g => g.length === 2);
    if (pairs.length === 6) {
      let head = pairs[0].concat(pairs[1][0]);
      let used = new Set(head);
      let mid = pairs[1].slice(1).concat(pairs[2], pairs[3][0]);
      used = new Set([...head, ...mid]);
      let tail = cards13.filter(c => !used.has(c));
      if (head.length === 3 && mid.length === 5 && tail.length === 5)
        return { head, middle: mid, tail, type: '六对半' };
    }
    return null;
  }
  function detectThreeStraight(cards13) {
    const comb3 = combinations(cards13, 3);
    for (const head of comb3) {
      if (!isStraightForAI(head)) continue;
      const left10 = cards13.filter(c => !head.includes(c));
      for (const mid of combinations(left10, 5)) {
        if (!isStraightForAI(mid)) continue;
        const tail = left10.filter(c => !mid.includes(c));
        if (!isStraightForAI(tail)) continue;
        return { head, middle: mid, tail, type: '三顺子' };
      }
    }
    return null;
  }
  function detectThreeFlush(cards13) {
    const comb3 = combinations(cards13, 3);
    for (const head of comb3) {
      if (!isFlushForAI(head)) continue;
      const left10 = cards13.filter(c => !head.includes(c));
      for (const mid of combinations(left10, 5)) {
        if (!isFlushForAI(mid)) continue;
        const tail = left10.filter(c => !mid.includes(c));
        if (!isFlushForAI(tail)) continue;
        return { head, middle: mid, tail, type: '三同花' };
      }
    }
    return null;
  }
  function detectAllSpecialSplits(cards13) {
    return detectDragon(cards13)
      || detectSixPairs(cards13)
      || detectThreeStraight(cards13)
      || detectThreeFlush(cards13)
      || null;
  }
  function isStraightForAI(cards) {
    const vals = uniq(cards.map(cardValue)).sort((a, b) => a - b);
    if (vals.length !== cards.length) return false;
    for (let i = 1; i < vals.length; ++i) if (vals[i] !== vals[i - 1] + 1) return false;
    if (vals.includes(14) && vals[0] === 2 && vals[1] === 3) {
      const t = vals.slice(); t[t.indexOf(14)] = 1; t.sort((a, b) => a - b);
      for (let i = 1; i < t.length; ++i) if (t[i] !== t[i - 1] + 1) return false;
      return true;
    }
    return true;
  }
  function isFlushForAI(cards) {
    if (!cards.length) return false;
    const suit = cardSuit(cards[0]);
    return cards.every(c => cardSuit(c) === suit);
  }
  
  // ==== 牌型判定/倒水/评分 ====
  function handTypeForAI(cards, area) {
    if (!cards || cards.length < 3) return "高牌";
    const vals = cards.map(cardValue), suits = cards.map(cardSuit),
      uniqVals = uniq(vals), uniqSuits = uniq(suits);
    if (cards.length === 5) {
      if (Object.values(groupBy(vals)).some(a => a.length === 4)) return "铁支";
      if (uniqSuits.length === 1 && isStraightForAI(cards)) return "同花顺";
      if (Object.values(groupBy(vals)).some(a => a.length === 3) && Object.values(groupBy(vals)).some(a => a.length === 2)) return "葫芦";
      if (uniqSuits.length === 1) return "同花";
      if (isStraightForAI(cards)) return "顺子";
      if (Object.values(groupBy(vals)).some(a => a.length === 3)) return "三条";
      if (Object.values(groupBy(vals)).filter(a => a.length === 2).length === 2) return "两对";
      if (Object.values(groupBy(vals)).some(a => a.length === 2)) return "对子";
      return "高牌";
    }
    if (cards.length === 3) {
      if (uniqVals.length === 1) return "三条";
      if (Object.values(groupBy(vals)).some(a => a.length === 2)) return "对子";
      return "高牌";
    }
    return "高牌";
  }
  function handTypeScoreForAI(cards, area) {
    const t = handTypeForAI(cards, area);
    switch (t) {
      case "铁支": return 8; case "同花顺": return 7; case "葫芦": return 6; case "同花": return 5; case "顺子": return 4;
      case "三条": return 3; case "两对": return 2; case "对子": return 1; default: return 0;
    }
  }
  function handTypeRankForAI(cards, area) {
    if (area === 'head') {
      const t = handTypeForAI(cards, area);
      if (t === "三条") return 4; if (t === "对子") return 2; return 1;
    }
    return handTypeScoreForAI(cards, area);
  }
  
  // ==== compareArea（同步sssScore.js核心） ====
  function compareAreaForAI(a, b, area) {
    const typeA = handTypeForAI(a, area), typeB = handTypeForAI(b, area);
    const rankA = handTypeRankForAI(a, area), rankB = handTypeRankForAI(b, area);
    if (rankA !== rankB) return rankA - rankB;
    const groupedA = groupBy(a.map(cardValue)), groupedB = groupBy(b.map(cardValue));
    if ((typeA === "顺子" || typeA === "同花顺")) {
      const valsA = a.map(cardValue).sort((a, b) => a - b), valsB = b.map(cardValue).sort((a, b) => a - b);
      const maxA = valsA[valsA.length - 1], maxB = valsB[valsB.length - 1];
      if (maxA !== maxB) return maxA - maxB;
    }
    if (["铁支", "三条", "对子"].includes(typeA)) {
      const mainA = parseInt(Object.keys(groupedA).find(k => groupedA[k].length === (typeA === "铁支" ? 4 : (typeA === "三条" ? 3 : 2))), 10);
      const mainB = parseInt(Object.keys(groupedB).find(k => groupedB[k].length === (typeA === "铁支" ? 4 : (typeA === "三条" ? 3 : 2))), 10);
      if (mainA !== mainB) return mainA - mainB;
      const subA = a.map(cardValue).filter(v => v !== mainA).sort((x, y) => y - x);
      const subB = b.map(cardValue).filter(v => v !== mainB).sort((x, y) => y - x);
      for (let i = 0; i < subA.length; ++i) if (subA[i] !== subB[i]) return subA[i] - subB[i];
      return 0;
    }
    if (typeA === "葫芦") {
      const tripleA = parseInt(Object.keys(groupedA).find(k => groupedA[k].length === 3), 10);
      const tripleB = parseInt(Object.keys(groupedB).find(k => groupedB[k].length === 3), 10);
      if (tripleA !== tripleB) return tripleA - tripleB;
      const pairA = parseInt(Object.keys(groupedA).find(k => groupedA[k].length === 2), 10);
      const pairB = parseInt(Object.keys(groupedB).find(k => groupedB[k].length === 2), 10);
      if (pairA !== pairB) return pairA - pairB;
      return 0;
    }
    if (typeA === "两对") {
      const pairsA = Object.keys(groupedA).filter(k => groupedA[k].length === 2).map(Number).sort((a, b) => b - a);
      const pairsB = Object.keys(groupedB).filter(k => groupedB[k].length === 2).map(Number).sort((a, b) => b - a);
      if (pairsA[0] !== pairsB[0]) return pairsA[0] - pairsB[0];
      if (pairsA[1] !== pairsB[1]) return pairsA[1] - pairsB[1];
      const subA = Object.keys(groupedA).find(k => groupedA[k].length === 1), subB = Object.keys(groupedB).find(k => groupedB[k].length === 1);
      if (subA && subB && subA !== subB) return subA - subB;
      return 0;
    }
    if (typeA === "同花") {
      const valsA = a.map(cardValue).sort((a, b) => b - a), valsB = b.map(cardValue).sort((a, b) => b - a);
      for (let i = 0; i < valsA.length; ++i) if (valsA[i] !== valsB[i]) return valsA[i] - valsB[i];
      return 0;
    }
    const valsA = a.map(cardValue).sort((a, b) => b - a), valsB = b.map(cardValue).sort((a, b) => b - a);
    for (let i = 0; i < valsA.length; ++i) if (valsA[i] !== valsB[i]) return valsA[i] - valsB[i];
    return 0;
  }
  
  // ==== 头道/尾道评分 ====
  function evalHead(head) {
    const t = handTypeForAI(head, 'head');
    let score = 0;
    if (t === "三条") score += 130;
    else if (t === "对子") score += 36;
    else score += 3;
    score += getTotalValue(head) * 1.18;
    return score;
  }
  function evalTail(tail) {
    const t = handTypeForAI(tail, 'tail');
    let score = 0;
    if (t === "同花顺") score += 10000; // 强制极高分
    if (t === "铁支") score += 240;
    else if (t === "葫芦") score += 130;
    else if (t === "顺子") score += 85;
    else if (t === "同花") score += 60;
    else if (t === "三条") score += 40;
    else if (t === "两对") score += 22;
    else if (t === "对子") score += 7;
    else score += 1;
    score += getTotalValue(tail) * 1.6;
    return score;
  }
  
  // ==== 均衡分法 ====
  function balancedSplit(cards) {
    const sorted = [...cards];
    return { head: sorted.slice(0, 3), middle: sorted.slice(3, 8), tail: sorted.slice(8, 13) };
  }

  export function isFoul(head, mid, tail) {
    const headRank = handTypeRankForAI(head, 'head');
    const midRank = handTypeRankForAI(mid, 'middle');
    const tailRank = handTypeRankForAI(tail, 'tail');
    if (!(headRank <= midRank && midRank <= tailRank)) return true;
    if (headRank === midRank && compareAreaForAI(head, mid, 'head') > 0) return true;
    if (midRank === tailRank && compareAreaForAI(mid, tail, 'middle') > 0) return true;
    return false;
  }
  
  function scoreSplit(head, mid, tail) {
    let sHead = evalHead(head), sMid = evalTail(mid), sTail = evalTail(tail);
    let score = sTail * 1.9 + sMid * 1.1 + sHead * 1.0;
    if (handTypeForAI(head, 'head') === '三条') score += 90;
    if (handTypeForAI(head, 'head') === '对子') score += 28;
    if (['葫芦', '顺子', '同花'].includes(handTypeForAI(mid, 'middle'))) score += 18;
    return score;
  }
  
  // ==== 核心导出：同花顺必做尾道 + 全局最优 ====
  export function getSmartSplits(cards13, opts = {}) {
    console.log('getSmartSplits input:', cards13);
    const special = detectAllSpecialSplits(cards13);
    if (special) return [special];
  
    for (const tail of combinations(cards13, 5)) {
      if (handTypeForAI(tail, 'tail') === '同花顺') {
        const left8 = cards13.filter(c => !tail.includes(c));
        let best = null, bestScore = -Infinity;
        for (const mid of combinations(left8, 5)) {
          const head = left8.filter(c => !mid.includes(c));
          if (head.length !== 3) continue;
          if (isFoul(head, mid, tail)) continue;
          const score = scoreSplit(head, mid, tail);
          if (score > bestScore) {
            bestScore = score;
            best = { head, middle: mid, tail };
          }
        }
        if (best) return [best];
        break;
      }
    }
  
    let bestSplit = null, bestScore = -Infinity;
    const tailComb = combinations(cards13, 5)
      .map(tail => ({ tail, score: evalTail(tail) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 14);
  
    for (const { tail } of tailComb) {
      const left8 = cards13.filter(c => !tail.includes(c));
      const midComb = combinations(left8, 5)
        .map(mid => ({ mid, score: evalTail(mid) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 12);
  
      for (const { mid } of midComb) {
        const head = left8.filter(c => !mid.includes(c));
        if (head.length !== 3) continue;
        if (isFoul(head, mid, tail)) continue;
        const score = scoreSplit(head, mid, tail);
        let tieBreaker = 0;
        if (handTypeForAI(head, 'head') === '三条') tieBreaker += 1000;
        if (handTypeForAI(head, 'head') === '对子') tieBreaker += 300;
        if (['葫芦', '顺子', '同花'].includes(handTypeForAI(mid, 'middle'))) tieBreaker += 40;
        if (score + tieBreaker > bestScore) {
          bestScore = score + tieBreaker;
          bestSplit = { head, middle: mid, tail };
        }
      }
    }
    if (bestSplit) return [bestSplit];
    return [balancedSplit(cards13)];
  }
  
  export function SmartSplit(cards13, opts) {
    console.log('SmartSplit input:', cards13);
    const splits = getSmartSplits(cards13, opts);
    console.log('SmartSplit output:', splits);
    return splits;
  }
  
  export function fillAiPlayers(playersArr) {
    return playersArr.map(p =>
      p.isAI && Array.isArray(p.cards13) && p.cards13.length === 13
        // --- 核心修正 ---
        // 错误地调用了 aiSmartSplit，应改为 SmartSplit
        ? { ...p, ...SmartSplit(p.cards13)[0] } 
        : p
    );
  }
  
  export { isFoul as isFoulForAI };
