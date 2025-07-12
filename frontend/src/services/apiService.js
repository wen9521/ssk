// frontend/src/services/apiService.js
// 描述: 统一处理对后端PHP API的HTTP请求。

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

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
        const data = await response.json();

        if (!response.ok || !data.success) {
            const errorMsg = data.message || `API请求失败，状态码: ${response.status}`;
            throw new Error(errorMsg);
        }
        
        return data.data;

    } catch (error) {
        console.error(`API请求错误: ${method} ${url}`, error);
        throw error;
    }
}

// --- 通用API ---
export const createRoom = (userId, gameType) => request('/create-room.php', 'POST', { userId, gameType });
export const joinRoom = (roomId, userId) => request('/join-room.php', 'POST', { roomId, userId });
export const getRoomStatus = (roomId) => request('/get-status.php', 'POST', { roomId });
export const startGame = (roomId, userId) => request('/start-game.php', 'POST', { roomId, userId });
export const resetRoom = (roomId, userId) => request('/reset-room.php', 'POST', { roomId, userId });

// --- 游戏逻辑API ---
export const bid = (roomId, userId, bid_value) => request('/bid.php', 'POST', { roomId, userId, bid_value });
export const setDun = (roomId, userId, hands) => request('/set-dun.php', 'POST', { roomId, userId, hands });
export const playCard = (roomId, userId, cards) => request('/play-card.php', 'POST', { roomId, userId, cards });
