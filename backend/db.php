<?php
// backend/db.php

// --- 请在这里输入您的数据库凭据 ---
$servername = "127.0.0.1"; // 数据库服务器地址 (例如 "localhost" 或 "127.0.0.1")
$username = "root";      // 数据库用户名
$password = "";          // 数据库密码
$dbname = "poker_game";    // 数据库名称
// ------------------------------------

// 创建数据库连接
$conn = new mysqli($servername, $username, $password, $dbname);

// 检查连接是否成功
if ($conn->connect_error) {
    // 如果连接失败, 终止脚本并返回一个 500 错误
    http_response_code(500);
    // 使用 json 格式返回错误, 方便前端调试
    die(json_encode([
        "success" => false,
        "message" => "数据库连接失败: " . $conn->connect_error
    ]));
}

// 设置字符集为 utf8mb4, 以支持 emoji 等特殊字符
$conn->set_charset("utf8mb4");

// 封装一个函数用于安全地关闭连接
function closeDbConnection(mysqli $conn) {
    $conn->close();
}

// 增加一个辅助函数, 用于统一返回JSON响应
function send_json_response($data) {
    header('Content-Type: application/json');
    echo json_encode($data);
}
?>
