/**
 * js/utils/cardParser.js
 * 
 * 功能：
 * 1. 定义扑克牌的花色和点数。
 * 2. 提供一个函数 `parseCardFilename`，用于将SVG文件名（如 "king_of_diamonds.svg"）
 *    解析成一个包含详细信息的对象。
 * 3. 导出一个常量 `FULL_DECK_FILES`，包含一副完整扑克牌（含大小王）的所有文件名，
 *    方便其他模块直接使用来创建牌组。
 */

// 定义花色映射
const SUITS = {
    spades:   { name: '黑桃', symbol: '♠', color: 'black' },
    hearts:   { name: '红桃', symbol: '♥', color: 'red' },
    diamonds: { name: '方块', symbol: '♦', color: 'red' },
    clubs:    { name: '梅花', symbol: '♣', color: 'black' },
};

// 定义点数映射，包含名称和用于排序的rank值
// 在斗地主等游戏中，2最大，A次之。可以根据不同游戏调整rank值。
const VALUES = {
    '2':   { name: '2', rank: 15 },
    ace:   { name: 'A', rank: 14 },
    king:  { name: 'K', rank: 13 },
    queen: { name: 'Q', rank: 12 },
    jack:  { name: 'J', rank: 11 },
    '10':  { name: '10', rank: 10 },
    '9':   { name: '9', rank: 9 },
    '8':   { name: '8', rank: 8 },
    '7':   { name: '7', rank: 7 },
    '6':   { name: '6', rank: 6 },
    '5':   { name: '5', rank: 5 },
    '4':   { name: '4', rank: 4 },
    '3':   { name: '3', rank: 3 },
};

/**
 * 根据SVG文件名解析扑克牌信息
 * @param {string} filename - 例如 "king_of_diamonds.svg" 或 "red_joker.svg"
 * @returns {object|null} - 返回一个包含牌面信息的对象，或在无法解析时返回null
 */
export function parseCardFilename(filename) {
    if (!filename || typeof filename !== 'string') {
        return null;
    }

    // 移除文件扩展名
    const nameOnly = filename.replace('.svg', '');

    // 处理大小王 (Jokers)
    if (nameOnly === 'red_joker') {
        return {
            id: filename, // 使用文件名作为唯一标识符
            type: 'joker',
            value: 'Red Joker',
            name: '大王',
            fullName: '大王',
            rank: 99, // 给予最高等级
        };
    }
    if (nameOnly === 'black_joker') {
        return {
            id: filename,
            type: 'joker',
            value: 'Black Joker',
            name: '小王',
            fullName: '小王',
            rank: 98, // 给予次高等级
        };
    }

    // 处理普通牌 (Normal cards)
    const parts = nameOnly.split('_of_');
    if (parts.length !== 2) {
        console.error(`Invalid card filename format: ${filename}`);
        return null; // 文件名格式不正确
    }

    const valueKey = parts[0];
    const suitKey = parts[1];

    const valueInfo = VALUES[valueKey];
    const suitInfo = SUITS[suitKey];

    if (!valueInfo || !suitInfo) {
        console.error(`Unknown value or suit in filename: ${filename}`);
        return null; // 未找到对应的点数或花色
    }

    return {
        id: filename,
        type: 'normal',
        suit: {
            key: suitKey,
            ...suitInfo
        },
        value: {
            key: valueKey,
            ...valueInfo
        },
        fullName: `${suitInfo.name}${valueInfo.name}`, // 例如 "黑桃A"
        rank: valueInfo.rank // 用于游戏内比较大小
    };
}

/**
 * 生成一副完整扑克牌的文件名列表
 * @returns {string[]}
 */
function generateFullDeckFiles() {
    const files = [];
    for (const suitKey in SUITS) {
        for (const valueKey in VALUES) {
            files.push(`${valueKey}_of_${suitKey}.svg`);
        }
    }
    files.push('red_joker.svg');
    files.push('black_joker.svg');
    return files;
}

// 导出一个包含所有54张牌文件名的常量数组
export const FULL_DECK_FILES = generateFullDeckFiles();
