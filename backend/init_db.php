<?php
// backend/init_db.php
// 描述: 数据库初始化脚本。

header('Content-Type: text/plain; charset=utf-8');

require_once __DIR__ . '/db.php';

$conn = getDbConnection();

echo "正在初始化数据库 '{$dbname}'...

";

$sql = "
-- 为了安全和数据完整性，先删除旧表
DROP TABLE IF EXISTS `players`;
DROP TABLE IF EXISTS `rooms`;

-- 创建 rooms 表
-- status: 'waiting', 'full', 'bidding', 'playing', 'scoring', 'finished'
-- game_type: 'thirteen_water', 'doudizhu', 'big_two'
CREATE TABLE `rooms` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `room_id` VARCHAR(16) NOT NULL UNIQUE,
    `game_type` VARCHAR(20) NOT NULL DEFAULT 'thirteen_water',
    `status` VARCHAR(20) NOT NULL DEFAULT 'waiting',
    `extra_data` TEXT,                        -- 存储游戏特定数据，例如斗地主的底牌 (JSON格式)
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `last_updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 创建 players 表
-- status: 'joined', 'dun_set', 'bid', 'landlord'
CREATE TABLE `players` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `room_id` VARCHAR(16) NOT NULL,
    `user_id` VARCHAR(255) NOT NULL,
    `is_creator` BOOLEAN NOT NULL DEFAULT FALSE,
    `status` VARCHAR(20) NOT NULL DEFAULT 'joined',
    `hand` TEXT,                          -- JSON 格式存储的13张初始手牌
    `front_hand` TEXT,                    -- JSON 格式存储的前墩牌 (3张)
    `middle_hand` TEXT,                   -- JSON 格式存储的中墩牌 (5张)
    `back_hand` TEXT,                     -- JSON 格式存储的后墩牌 (5张)
    `score` INT NOT NULL DEFAULT 0,       -- 本局得分
    `extra_data` TEXT,                    -- 存储玩家特定数据，例如斗地主的叫分
    `joined_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`room_id`) REFERENCES `rooms`(`room_id`) ON DELETE CASCADE,
    UNIQUE KEY `room_user_unique` (`room_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
";

// 执行SQL语句
if ($conn->multi_query($sql)) {
    // 消耗掉所有查询结果
    while ($conn->next_result()) {
        if ($result = $conn->store_result()) {
            $result->free();
        }
    }
    echo "成功！数据库表 'rooms' 和 'players' 已成功创建/重置。
";
    echo "数据库结构已更新，增加了 'extra_data' 字段以支持斗地主等复杂游戏。
";
} else {
    echo "错误: 初始化数据库失败: " . $conn->error . "
";
}

closeDbConnection($conn);
