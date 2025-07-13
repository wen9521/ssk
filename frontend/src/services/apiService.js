// frontend/src/services/apiService.js
// 描述: 统一处理对后端PHP API的HTTP请求。

const API_BASE_URL = 'https://9525.ip-ddns.com/backend/api';

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
        // 尝试解析JSON，即使响应失败，也可能包含有用的错误信息
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            // 优先使用后端返回的错误消息
            const errorMsg = data.message || `API请求失败，状态码: ${response.status}`;
            throw new Error(errorMsg);
        }
        
        if (!data.success) {
            throw new Error(data.message || 'API返回操作失败');
        }

        return data.data;

    } catch (error) {
        console.error(`API请求错误: ${method} ${url}`, error);
        throw error;
    }
}

// --- 游戏大厅 API ---
export const quickPlay = (userId, gameType) => request('/quick-play.php', 'POST', { userId, gameType });
export const matchmaking = (action, userId, gameType = null) => request('/matchmaking.php', 'POST', { action, userId, gameType });


// --- 游戏逻辑 API ---
export const getRoomStatus = (roomId) => request('/get-status.php', 'POST', { roomId });
export const bid = (roomId, userId, bid_value) => request('/bid.php', 'POST', { roomId, userId, bid_value });
export const setDun = (roomId, userId, hands) => request('/set-dun.php', 'POST', { roomId, userId, hands });
export const playCard = (roomId, userId, cards) => request('/play-card.php', 'POST', { roomId, userId, cards });
