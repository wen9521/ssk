/**
 * main.js
 * 
 * 这是前端应用的主控制器。
 * - 负责初始化应用。
 * - 管理UI界面的渲染和切换。
 * - 协调游戏逻辑、用户输入和网络通信。
 */

// -------------------- 模块导入 --------------------
// UI 组件
import { renderLobby } from './src/components/lobby.js';
import { renderGameBoard } from './src/components/game-board.js';
import { renderPlayerHand, updateCardCount } from './src/components/card.js';

// 游戏逻辑
import { DouDizhuGame } from './src/game-logic/doudizhu-rules.js';

// 网络服务
import { websocketClient } from './src/services/websocket.js';


// -------------------- 全局变量和DOM引用 --------------------
const app = document.getElementById('app');
let currentGame = null; // 用于存储当前游戏实例（离线或在线）


// -------------------- 核心功能函数 --------------------

/**
 * 显示游戏大厅界面，并绑定模式选择按钮的事件。
 */
function showLobby() {
    console.log("Showing lobby...");
    app.innerHTML = renderLobby();
    document.getElementById('start-offline-btn').addEventListener('click', startOfflineGame);
    
    const onlineBtn = document.getElementById('start-online-btn');
    onlineBtn.disabled = false; // 激活在线模式按钮
    onlineBtn.addEventListener('click', startOnlineGame);
}

/**
 * 启动单机离线模式。
 */
function startOfflineGame() {
    console.log("Starting offline game...");

    // 1. 创建游戏实例
    const playerNames = ['你 (地主)', '上家 (AI)', '下家 (AI)'];
    currentGame = new DouDizhuGame(playerNames);
    
    // 2. 渲染游戏面板
    app.innerHTML = renderGameBoard(currentGame.players);
    
    // 3. 开始游戏（内部会洗牌、发牌、决定地主）
    currentGame.startGame();
    
    // 4. 渲染所有玩家的手牌，并更新牌数显示
    currentGame.players.forEach(player => {
        renderPlayerHand(player.id, player.hand);
        updateCardCount(player.id, player.hand.length);
    });
    
    // 5. 绑定游戏操作按钮
    document.getElementById('play-btn').addEventListener('click', handlePlayCard_Offline);
    document.getElementById('pass-btn').addEventListener('click', handlePass_Offline);
    
    // 6. 如果地主不是玩家，则触发AI行动
    //    (这部分逻辑可以在一个游戏循环中处理，此处为简化示例)
}

/**
 * 启动在线对战模式。
 */
function startOnlineGame() {
    console.log("Starting online game...");
    alert('正在尝试连接到在线服务器...');
    
    // 注册WebSocket事件回调
    websocketClient.on('open', () => {
        console.log("成功连接到服务器！");
        alert("已连接到服务器！请在大厅选择房间或创建新房间。");
        // TODO: 在UI上显示房间列表
        websocketClient.send({ action: 'join_lobby', user: 'Player' + Math.floor(Math.random() * 1000) });
    });

    websocketClient.on('message', (data) => {
        console.log('从服务器收到消息:', data);
        // 在这里根据服务器指令更新游戏状态和UI
        handleServerMessage(data);
    });

    websocketClient.on('close', () => {
        console.warn("与服务器的连接已断开。正在尝试重连...");
        alert("与服务器断开连接，正在尝试重连...");
    });
    
    websocketClient.on('error', (error) => {
        console.error("WebSocket 连接发生错误。", error);
        alert("无法连接到在线服务器，请检查网络或稍后再试。");
        showLobby(); // 连接失败，返回大厅
    });
    
    // 启动连接
    websocketClient.connect();
}


// -------------------- 事件处理函数 --------------------

/**
 * 处理离线模式下的出牌操作。
 */
function handlePlayCard_Offline() {
    // 这是一个简化的示例，实际需要获取玩家通过点击选择的牌
    const selectedCards = document.querySelectorAll('#hand-player-0 .card.selected');
    if (selectedCards.length === 0) {
        alert("请先选择要出的牌！");
        return;
    }
    
    const selectedCardIds = Array.from(selectedCards).map(card => card.dataset.cardId);
    console.log("你选择了出牌:", selectedCardIds);
    alert(`你出了 ${selectedCards.length} 张牌。（验证逻辑待实现）`);
    // TODO: 调用 currentGame.play(selectedCardIds) 并更新UI
}

/**
 * 处理离线模式下的“不要”操作。
 */
function handlePass_Offline() {
    console.log("你选择了“不要”。");
    alert("你选择了“不要”。（轮到下一位AI出牌的逻辑待实现）");
    // TODO: 调用 currentGame.pass() 并更新UI
}

/**

 * 统一处理从服务器收到的 WebSocket 消息。
 * @param {object} data - 从服务器发来的解析后的JSON数据。
 */
function handleServerMessage(data) {
    switch(data.action) {
        case 'welcome':
            console.log(`服务器欢迎信息: ${data.message}`);
            break;
        case 'update_room_list':
            // TODO: 在UI上渲染房间列表
            console.log('更新房间列表:', data.rooms);
            break;
        case 'game_start':
            // 服务器通知游戏开始，需要渲染游戏面板
            console.log('游戏开始!', data.gameInfo);
            app.innerHTML = renderGameBoard(data.gameInfo.players);
            break;
        case 'deal_cards':
            // 收到自己的手牌信息
            console.log('收到手牌:', data.hand);
            const myPlayerId = '...'; // 你需要一个方式知道自己的ID
            renderPlayerHand(myPlayerId, data.hand);
            updateCardCount(myPlayerId, data.hand.length);
            break;
        case 'player_played':
            // 其他玩家出牌了，更新出牌区和他的剩余牌数
            console.log(`玩家 ${data.playerId} 出了:`, data.cards);
            // TODO: 更新UI
            break;
        default:
            console.warn('收到未知的服务器指令:', data.action);
    }
}


// -------------------- 应用初始化 --------------------

/**
 * 应用的入口函数，负责初始化所有内容。
 */
function initialize() {
    // 注册 Service Worker 以实现离线缓存功能
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => console.log('Service Worker registered successfully:', registration.scope))
                .catch(error => console.error('Service Worker registration failed:', error));
        });
    } else {
        console.log('Service Worker is not supported by this browser.');
    }
    
    // 默认显示游戏大厅界面
    showLobby();
}

// 当DOM加载完毕后，启动应用
document.addEventListener('DOMContentLoaded', initialize);
