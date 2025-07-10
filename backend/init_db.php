<?php
// backend/init_db.php
// 描述: 用于初始化MySQL数据库表的脚本。
// 运行方式: 将项目部署到支持PHP和MySQL的服务器后, 通过浏览器或命令行访问此文件一次。

header('Content-Type: text/plain; charset=utf-8');

require_once __DIR__ . '/db.php';

echo "正在尝试连接到数据库 '{$dbname}'...
";

// 连接信息已在 db.php 中处理
global $conn;

echo "数据库连接成功！

";

// --- SQL 建表语句 ---
// 使用更适合 MySQL 的语法和数据类型
$sql = "
-- 删除已存在的旧表, 以便重新创建
DROP TABLE IF EXISTS `players`;
DROP TABLE IF EXISTS `rooms`;

-- 创建房间表 (rooms)
CREATE TABLE `rooms` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `room_id` VARCHAR(10) NOT NULL UNIQUE COMMENT '易于记忆的房间号, 如 ABCDE',
  `status` VARCHAR(20) NOT NULL DEFAULT 'lobby' COMMENT '房间状态: lobby, playing, comparing, finished',
  `host_id` VARCHAR(255) NOT NULL COMMENT '房主玩家的 player_id',
  `game_data` JSON COMMENT '存储完整的游戏状态, 如牌堆、当前轮次等',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_room_id` (`room_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 创建玩家表 (players)
CREATE TABLE `players` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `player_id` VARCHAR(255) NOT NULL UNIQUE COMMENT '每个玩家的唯一标识, 可以是 session_id',
  `room_id` VARCHAR(10) NOT NULL COMMENT '玩家所在的房间号',
  `name` VARCHAR(50) NOT NULL COMMENT '玩家昵称',
  `hand` JSON COMMENT '玩家手上的13张牌',
  `dun` JSON COMMENT '玩家理好的牌墩 {head, middle, tail}',
  `score` INT NOT NULL DEFAULT 0 COMMENT '玩家在本局的分数',
  `is_ready` BOOLEAN NOT NULL DEFAULT 0 COMMENT '玩家是否已提交理牌',
  `joined_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`room_id`) REFERENCES `rooms`(`room_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
";

echo "准备执行以下 SQL 语句:
";
echo "---------------------------------
";
echo $sql;
echo "---------------------------------

";

// 使用 multi_query 来执行多个SQL语句
if ($conn->multi_query($sql)) {
    // 循环清空每个查询的结果, 这是 multi_query 的标准操作
    do {
        if ($result = $conn->store_result()) {
            $result->free();
        }
    } while ($conn->more_results() && $conn->next_result());
    echo "成功！数据库表 'rooms' 和 'players' 已创建。
";
} else {
    echo "错误！创建数据库表失败: " . $conn->error . "
";
}

// 关闭数据库连接
closeDbConnection($conn);
?>
