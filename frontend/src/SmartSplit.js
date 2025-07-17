// 简化的智能分牌算法
export const aiSmartSplit = (cards) => {
  // 简化的AI智能分牌逻辑
  return {
    head: cards.slice(0, 3),
    middle: cards.slice(3, 8),
    tail: cards.slice(8, 13)
  };
};

export const getPlayerSmartSplits = (cards) => {
  // 简化的玩家智能分牌方案
  return [
    {
      head: cards.slice(0, 3),
      middle: cards.slice(3, 8),
      tail: cards.slice(8, 13)
    },
    {
      head: cards.slice(1, 4),
      middle: cards.slice(4, 9),
      tail: [...cards.slice(0, 1), ...cards.slice(9, 13)]
    }
  ];
};
