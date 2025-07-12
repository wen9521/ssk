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
DROP TABLE IF EXISTS `matchmaking_queue`;
DROP TABLE IF EXISTS `players`;
DROP TABLE IF EXISTS `rooms`;

-- 创建 rooms 表
CREATE TABLE `rooms` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `room_id` VARCHAR(16) NOT NULL UNIQUE,
    `game_type` VARCHAR(20) NOT NULL DEFAULT 'thirteen_water',
    `status` VARCHAR(20) NOT NULL DEFAULT 'waiting',
    `extra_data` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `last_updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 创建 players 表
CREATE TABLE `players` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `room_id` VARCHAR(16) NOT NULL,
    `user_id` VARCHAR(255) NOT NULL,
    `is_creator` BOOLEAN NOT NULL DEFAULT FALSE,
    `status` VARCHAR(20) NOT NULL DEFAULT 'joined',
    `hand` TEXT,
    `front_hand` TEXT,
    `middle_hand` TEXT,
    `back_hand` TEXT,
    `score` INT NOT NULL DEFAULT 0,
    `extra_data` TEXT,
    `joined_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`room_id`) REFERENCES `rooms`(`room_id`) ON DELETE CASCADE,
    UNIQUE KEY `room_user_unique` (`room_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 新增：创建 matchmaking_queue 表 (匹配队列)
CREATE TABLE `matchmaking_queue` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(255) NOT NULL,
  `game_type` varchar(20) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'waiting', -- 'waiting', 'matched', 'cancelled'
  `matched_room_id` varchar(16) DEFAULT NULL,
  `entered_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_game_type_unique` (`user_id`,`game_type`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
";

// 执行SQL语句
if ($conn->multi_query($sql)) {
    // ... (消耗结果的逻辑保持不变)
    while ($conn->next_result()) {
        if ($result = $conn->store_result()) {
            $result->free();
        }
    }
    echo "成功！数据库表已成功创建/重置，并新增了 'matchmaking_queue' 表。
";
} else {
    echo "错误: 初始化数据库失败: " . $conn->error . "
";
}

closeDbConnection($conn);
