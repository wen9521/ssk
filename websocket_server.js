// websocket_server.js
// 这是一个极其轻量级的 WebSocket 服务器，用于处理实时游戏数据。
// 它使用 'ws' 库，这是 Node.js 中最高效、最基础的 WebSocket 库之一。

const WebSocket = require('ws');

// 创建一个 WebSocket 服务器，监听 8080 端口。
// 在实际部署中，你需要确保服务器的防火墙或安全组允许外部访问这个端口。
const wss = new WebSocket.Server({ port: 8080 });

// 使用一个 Map 来存储所有的游戏房间。
// 键是 room_id，值是一个 Set，包含该房间内所有玩家的 WebSocket 连接。
const rooms = new Map();

console.log('WebSocket 服务器已启动，正在监听 8080 端口...');

// 监听连接事件
wss.on('connection', (ws, req) => {
    // 从连接 URL 中获取 room_id。
    // 客户端连接的 URL 应该是 ws://your_server_ip:8080?roomId=YOUR_ROOM_ID
    const url = new URL(req.url, `http://${req.headers.host}`);
    const roomId = url.searchParams.get('roomId');
    const playerId = url.searchParams.get('playerId'); // 假设客户端也会传来 playerId

    if (!roomId || !playerId) {
        console.log('连接失败：缺少 roomId 或 playerId');
        ws.close();
        return;
    }

    console.log(`玩家 ${playerId} 正在尝试加入房间 ${roomId}`);

    // 如果房间不存在，就创建一个新的
    if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
    }

    const room = rooms.get(roomId);

    // 检查房间是否已满（例如，最多4人）
    if (room.size >= 4 && !Array.from(room).some(client => client.playerId === playerId)) {
        console.log(`房间 ${roomId} 已满，拒绝玩家 ${playerId} 加入。`);
        ws.close();
        return;
    }
    
    // 将玩家的 WebSocket 实例和 playerId 存储起来
    ws.playerId = playerId; 
    room.add(ws);
    
    console.log(`玩家 ${playerId} 已成功加入房间 ${roomId}。当前房间人数: ${room.size}`);

    // --- 广播消息给房间内的所有其他玩家 ---
    const joinMessage = JSON.stringify({
        type: 'player_join',
        message: `玩家 ${playerId} 加入了游戏！`,
        roomSize: room.size
    });

    room.forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(joinMessage);
        }
    });


    // 监听客户端发来的消息
    ws.on('message', message => {
        console.log(`收到来自 ${playerId} 的消息: ${message}`);
        
        // --- 广播逻辑 ---
        // 将收到的消息转发给房间内的所有其他玩家。
        // 在实际应用中，你会在服务器端进行游戏逻辑的判断和处理。
        room.forEach(client => {
            // 检查 client 是否是发送者自己，以及连接是否仍然开放
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                // 为了追溯消息来源，可以包装一下消息
                const broadcastMessage = JSON.stringify({
                    sender: playerId,
                    data: JSON.parse(message) // 假设客户端发送的是 JSON 字符串
                });
                client.send(broadcastMessage);
            }
        });
    });

    // 监听连接关闭事件
    ws.on('close', () => {
        // 从房间中移除该玩家
        room.delete(ws);
        console.log(`玩家 ${playerId} 已离开房间 ${roomId}。当前房间人数: ${room.size}`);

        // --- 广播玩家离开的消息 ---
        const leaveMessage = JSON.stringify({
            type: 'player_leave',
            message: `玩家 ${playerId} 离开了游戏。`,
            roomSize: room.size
        });
        
        room.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(leaveMessage);
            }
        });

        // 如果房间空了，可以从 Map 中删除这个房间以释放内存
        if (room.size === 0) {
            rooms.delete(roomId);
            console.log(`房间 ${roomId} 已空，已被移除。`);
        }
    });

    ws.on('error', error => {
        console.error(`玩家 ${playerId} 的连接发生错误:`, error);
    });
});
