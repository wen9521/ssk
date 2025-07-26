// card-utils.js
const cardModules = import.meta.glob('../assets/cards/*.svg', { eager: true, as: 'url' });

// 生成映射： 'ace_of_spades' → '/assets/cards/ace_of_spades.abc123.svg'
export const cardMap = Object.fromEntries(
  Object.entries(cardModules).map(([filePath, url]) => {
    const filename = filePath.split('/').pop().replace('.svg', '');
    return [filename, url];
  })
);

// 根据传入的卡牌对象或代码字符串获取图片 URL
export function getCardImage(card) {
  if (card.rank && card.suit) {
    const rankStr = String(card.rank).toLowerCase();
    const suitStr = String(card.suit).toLowerCase();
    const code = `${rankStr}_of_${suitStr}`;
    return cardMap[code];
  }
  return cardMap[card] || '';
}