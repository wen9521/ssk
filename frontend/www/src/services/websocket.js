/**
 * websocket.js
 * 
 * 功能：
 * 1. 封装 WebSocket 连接，提供简单的 connect 和 disconnect 方法。
 * 2. 自动处理重连逻辑，当连接意外断开时会尝试重新连接。
 * 3. 使用事件回调（onOpen, onMessage, onClose, onError）来处理服务器消息和连接状态变化，
 *    实现与主逻辑的解耦。
 * 4. 提供一个 send 方法来向服务器发送格式化的 JSON 数据。
 */

// -------------------- 配置 --------------------
// 你的后端 WebSocket 服务器地址。
// 🔴 重要提示:
// 1. 请将 'YOUR_SERV00_IP_OR_DOMAIN' 替换为你的 Serv00 服务器的真实 IP 地址或域名。
// 2. 端口号 '8080' 必须与你后端 server.php 中设置的端口一致，并确保 Serv00 防火墙允许该端口。
// 3. 协议 'ws://' (不安全) 或 'wss://' (安全)。
//    - 如果你的前端部署在 `https://...` (Cloudflare Pages 默认)，浏览器会强制要求使用 `wss://`。
//    - Serv00 的免费套餐可能不直接支持 `wss://`。你可能需要配置反向代理（如 Nginx）来实现。
//    - 在开发初期，你可以通过 http://localhost 访问前端来测试 `ws://` 连接，以绕过安全限制。
const WEBSOCKET_URL = 'ws://9525.ip-ddns.com:14722';

const RECONNECT_INTERVAL = 3000; // 断线后每隔3秒尝试重连


// -------------------- WebSocket 客户端封装 --------------------

class WebSocketClient {
    constructor() {
        this.ws = null;
        this.callbacks = {};
        this.reconnectTimer = null;
    }

    /**
     * 注册事件回调
     * @param {string} eventName - 'open', 'message', 'close', 'error'
     * @param {function} callback - 事件发生时执行的回调函数
     */
    on(eventName, callback) {
        this.callbacks[eventName] = callback;
    }

    /**
     * 连接到 WebSocket 服务器
     */
    connect() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log('WebSocket is already connected.');
            return;
        }

        console.log(`Attempting to connect to ${WEBSOCKET_URL}...`);
        
        // 创建一个新的 WebSocket 实例
        this.ws = new WebSocket(WEBSOCKET_URL);

        this.ws.onopen = (event) => {
            console.log('WebSocket connection established.');
            // 清除可能存在的重连计时器
            if (this.reconnectTimer) {
                clearTimeout(this.reconnectTimer);
                this.reconnectTimer = null;
            }
            // 执行 'open' 回调
            if (this.callbacks.open) {
                this.callbacks.open(event);
            }
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                // console.log('Received message:', data);
                // 执行 'message' 回调，并传入解析后的数据
                if (this.callbacks.message) {
                    this.callbacks.message(data);
                }
            } catch (e) {
                console.error('Error parsing received message:', event.data, e);
            }
        };

        this.ws.onclose = (event) => {
            console.warn('WebSocket connection closed.', event);
            // 执行 'close' 回调
            if (this.callbacks.close) {
                this.callbacks.close(event);
            }
            // 启动自动重连机制
            this.reconnect();
        };

        this.ws.onerror = (event) => {
            console.error('WebSocket error observed:', event);
            // 执行 'error' 回调
            if (this.callbacks.error) {
                this.callbacks.error(event);
            }
            // 发生错误时，onclose 事件通常也会被触发，所以重连逻辑会由 onclose 处理
        };
    }

    /**
     * 发送数据到服务器
     * @param {object} data - 要发送的JavaScript对象，会自动转换为JSON字符串
     */
    send(data) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.error('WebSocket is not connected. Cannot send message.');
            return;
        }
        this.ws.send(JSON.stringify(data));
    }
    
    /**
     * 断开连接
     */
    disconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.ws) {
            // 设置一个不会触发重连的关闭码
            this.ws.close(1000, 'Manual disconnection');
        }
    }

    /**
     * 内部方法，用于处理重连
     * @private
     */
    reconnect() {
        // 如果已经有重连计时器在运行，则不重复创建
        if (this.reconnectTimer) return;

        console.log(`Will attempt to reconnect in ${RECONNECT_INTERVAL / 1000} seconds.`);
        this.reconnectTimer = setTimeout(() => {
            this.connect();
        }, RECONNECT_INTERVAL);
    }
}

// 导出一个单例，确保整个应用共享同一个WebSocket连接实例
export const websocketClient = new WebSocketClient();
