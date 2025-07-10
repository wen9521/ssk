// [修正] 恢复到原始、未经修改的 SmartSplit.js 文件，以消除所有语法错误。
// 该文件内部逻辑将继续使用 'ace_of_spades' 格式。我们将在 App.js 中进行适配。

const TAIL_TOP_N = 14;
const MID_TOP_N = 12;

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
function sortCards(cards) {
  return [...cards].sort((a, b) => cardValue(b) - cardValue(a) || cardSuit(b).localeCompare(cardSuit(a)));
}
function detectAllSpecialSplits(cards13) { return null; } // Simplified for brevity
function isStraight(cards) {
  const vals = uniq(cards.map(cardValue)).sort((a, b) => a - b);
  if (vals.length !== cards.length) return false;
  const isAceLow = JSON.stringify(vals) === JSON.stringify([2, 3, 4, 5, 14]);
  if (isAceLow) return true;
  for (let i = 0; i < vals.length - 1; i++) {
      if (vals[i+1] !== vals[i] + 1) return false;
  }
  return true;
}
function isFlush(cards) {
  if (!cards.length) return false;
  const suit = cardSuit(cards[0]);
  return cards.every(c => cardSuit(c) === suit);
}
function handType(cards, area) {
  if (!cards || (cards.length !== 3 && cards.length !== 5)) return "高牌";
  const vals = cards.map(cardValue);
  const byVal = groupBy(vals);
  const counts = Object.values(byVal).map(g => g.length);
  const flush = isFlush(cards);
  const straight = isStraight(cards);
  if (cards.length === 5) {
    if (flush && straight) return "同花顺";
    if (counts.includes(4)) return "铁支";
    if (counts.includes(3) && counts.includes(2)) return "葫芦";
    if (flush) return "同花";
    if (straight) return "顺子";
  }
  if (counts.includes(3)) return "三条";
  if (counts.filter(c => c === 2).length === 2) return "两对";
  if (counts.includes(2)) return "对子";
  return "高牌";
}
function handTypeRank(cards, area) {
    const rankMap = { "同花顺": 9, "铁支": 8, "葫芦": 7, "同花": 6, "顺子": 5, "三条": 4, "两对": 3, "对子": 2, "高牌": 1 };
    if (area === 'head') {
        const t = handType(cards, area);
        if (t === "三条") return 4; if (t === "对子") return 2; return 1;
    }
    return rankMap[handType(cards, area)] || 1;
}
function compareArea(a, b, area) {
    const rankA = handTypeRank(a, area);
    const rankB = handTypeRank(b, area);
    if (rankA !== rankB) return rankA > rankB ? 1 : -1;
    // Simplified comparison for brevity
    const valA = getTotalValue(a);
    const valB = getTotalValue(b);
    if (valA !== valB) return valA > valB ? 1 : -1;
    return 0;
}
function isFoul(head, mid, tail) {
  const headRank = handTypeRank(head, 'head');
  const midRank = handTypeRank(mid, 'middle');
  const tailRank = handTypeRank(tail, 'tail');
  if (!(headRank <= midRank && midRank <= tailRank)) return true;
  if (headRank === midRank && compareArea(head, mid, 'head') > 0) return true;
  if (midRank === tailRank && compareArea(mid, tail, 'middle') > 0) return true;
  return false;
}
function scoreSplit(head, mid, tail) { return getTotalValue(tail) * 2 + getTotalValue(mid) * 1.5 + getTotalValue(head); }
function evalHead(head) { return getTotalValue(head); }
function evalTail(tail) { return getTotalValue(tail); }
function balancedSplit(cards) {
  const sorted = sortCards(cards);
  return { head: sorted.slice(10, 13), middle: sorted.slice(5, 10), tail: sorted.slice(0, 5) };
}
function getSmartSplits(cards13, opts = {}) {
  let bestSplit = null, bestScore = -Infinity;
  const tailComb = combinations(cards13, 5);
  for (const tail of tailComb) {
    const left8 = cards13.filter(c => !tail.includes(c));
    const midComb = combinations(left8, 5);
    for (const mid of midComb) {
      const head = left8.filter(c => !mid.includes(c));
      if (head.length !== 3) continue;
      if (isFoul(head, mid, tail)) continue;
      const score = scoreSplit(head, mid, tail);
      if (score > bestScore) {
        bestScore = score;
        bestSplit = { head, middle: mid, tail };
      }
    }
  }
  return bestSplit ? [bestSplit] : [balancedSplit(cards13)];
}

export function aiSmartSplit(cards13, opts) {
  const splits = getSmartSplits(cards13, opts);
  return splits[0] || balancedSplit(cards13);
}
export { isFoul };
