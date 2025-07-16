// frontend/src/services/apiService.js
// 描述: 统一处理对后端PHP API的HTTP请求。
// 修复：所有函数都被修改为返回一个Promise.reject，因为后端目前未部署。
// 这可以防止应用在调用这些函数时崩溃，并清楚地表明功能不可用。

const featureUnavailableError = () => {
    const errorMsg = "在线游戏功能当前不可用，因为后端服务未部署。";
    console.warn(errorMsg); // 在控制台警告，方便调试
    return Promise.reject(new Error(errorMsg));
};


// --- 导出所有API函数 (全部禁用) ---

// 游戏房间相关
export const createRoom = () => featureUnavailableError();
export const joinRoom = () => featureUnavailableError();
export const getRoomStatus = (roomId) => featureUnavailableError();

// 游戏操作相关
export const quickPlay = (userId, gameType) => featureUnavailableError();
export const playCard = (roomId, userId, cards) => featureUnavailableError();
export const setDun = (roomId, userId, hands) => featureUnavailableError();

// 斗地主专用
export const bid = (roomId, userId, bidValue) => featureUnavailableError();

// 匹配相关 - 组合成一个对象导出
export const matchmaking = {
    join: (userId, gameType) => featureUnavailableError(),
    leave: (userId) => featureUnavailableError(),
    status: (userId) => featureUnavailableError(),
};
