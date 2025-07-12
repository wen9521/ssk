// frontend/src/services/websocketService.js
// 描述: 管理与后端Node.js服务器的WebSocket连接。

const WEBSOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL;

class WebSocketService {
    constructor() {
        this.socket = null;
        this.messageListeners = new Set(); // 存储所有监听消息的处理器
    }

    /**
     * 连接到WebSocket服务器
     * @param {string} roomId 房间ID
     * @param {string} playerId 玩家ID
     */
    connect(roomId, playerId) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            console.log("WebSocket已经连接。");
            return;
        }

        const url = `${WEBSOCKET_URL}?roomId=${roomId}&playerId=${playerId}`;
        this.socket = new WebSocket(url);

        this.socket.onopen = () => {
            console.log(`WebSocket已连接到房间 ${roomId}`);
            const event = new CustomEvent('ws_message', { detail: { type: 'connection_open', message: '连接成功！' }});
            this.dispatchMessage(event.detail);
        };

        this.socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                console.log("收到WebSocket消息:", message);
                this.dispatchMessage(message);
            } catch (error) {
                console.error("解析WebSocket消息失败:", error);
            }
        };

        this.socket.onclose = () => {
            console.log("WebSocket连接已关闭。");
            const event = new CustomEvent('ws_message', { detail: { type: 'connection_close', message: '连接已断开！' }});
            this.dispatchMessage(event.detail);
            this.socket = null;
        };

        this.socket.onerror = (error) => {
            console.error("WebSocket错误:", error);
            const event = new CustomEvent('ws_message', { detail: { type: 'connection_error', message: '连接发生错误！' }});
            this.dispatchMessage(event.detail);
        };
    }

    /**
     * 发送消息
     * @param {object} data 要发送的数据对象
     */
    sendMessage(data) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(data));
        } else {
            console.error("无法发送消息：WebSocket未连接。");
        }
    }

    /**
     * 断开连接
     */
    disconnect() {
        if (this.socket) {
            this.socket.close();
        }
    }

    /**
     * 添加消息监听器
     * @param {function} callback 监听到消息时调用的回调函数
     */
    addMessageListener(callback) {
        this.messageListeners.add(callback);
    }

    /**
     * 移除消息监听器
     * @param {function} callback 要移除的回调函数
     */
    removeMessageListener(callback) {
        this.messageListeners.delete(callback);
    }

    /**
     * 将收到的消息分发给所有监听器
     * @param {object} message 
     */
    dispatchMessage(message) {
        this.messageListeners.forEach(listener => listener(message));
    }
}

// 创建并导出一个单例
const webSocketService = new WebSocketService();
export default webSocketService;
