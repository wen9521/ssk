// frontend/src/services/apiService.js
// 描述: 统一处理对后端PHP API的HTTP请求。
// 修复：更改为命名导出以解决编译错误。

const API_BASE_URL = 'https://9525.ip-ddns.com/api';

async function request(endpoint, method = 'POST', body = null) {
    const url = `${API_BASE_URL}${endpoint}`;
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url, options);
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            const errorMsg = data.message || `API请求失败，状态码: ${response.status}`;
            throw new Error(errorMsg);
        }
        
        if (!data.success) {
            throw new Error(data.message || 'API返回操作失败');
        }

        return data.data;
    } catch (error) {
        console.error("API请求错误:", error);
        throw error;
    }
}

// --- 导出所有API函数 ---

// 游戏房间相关
// 注意：createRoom 和 joinRoom 的后端文件不存在，这里是虚拟实现以允许项目编译。
export const createRoom = () => Promise.reject(new Error("功能未实现：create-room.php 不存在。"));
export const joinRoom = () => Promise.reject(new Error("功能未实现：join-room.php 不存在。"));
export const getRoomStatus = (roomId) => request('/get-status.php', 'POST', { roomId });

// 游戏操作相关
export const quickPlay = (userId, gameType) => request('/quick-play.php', 'POST', { userId, gameType });
export const playCard = (roomId, userId, cards) => request('/play-card.php', 'POST', { roomId, userId, cards });
export const setDun = (roomId, userId, hands) => request('/set-dun.php', 'POST', { roomId, userId, hands });

// 斗地主专用
export const bid = (roomId, userId, bidValue) => request('/bid.php', 'POST', { roomId, userId, bid_value: bidValue });

// 匹配相关
export const joinMatchmaking = (userId, gameType) => request('/matchmaking.php', 'POST', { action: 'join', userId, gameType });
export const leaveMatchmaking = (userId) => request('/matchmaking.php', 'POST', { action: 'leave', userId });
export const checkMatchmakingStatus = (userId) => request('/matchmaking.php', 'POST', { action: 'status', userId });
