// 简化的分数计算和倒水判断
export const calcSSSAllScores = (players) => {
  // 简化分数计算
  return players.map((_, i) => Math.floor(Math.random() * 100) - 50);
};

export const isFoul = (head, middle, tail) => {
  // 简化倒水判断
  return Math.random() > 0.7; // 30%几率倒水
};
