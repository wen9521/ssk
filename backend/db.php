<?php
// backend/db.php
// 描述: 数据库连接配置文件和工具函数。

// --- 数据库连接配置 ---
// 在生产环境中, 强烈建议使用环境变量来存储这些敏感信息, 而不是硬编码在代码中。
$servername = "127.0.0.1";
$username = "user";
$password = "password";
$dbname = "thirteen_water";

/**
 * 创建并返回一个 MySQLi 数据库连接实例。
 * 如果连接失败, 会记录错误并终止脚本。
 * @return mysqli 数据库连接对象
 */
function getDbConnection() {
    global $servername, $username, $password, $dbname;

    // 创建连接
    $conn = new mysqli($servername, $username, $password, $dbname);

    // 检查连接是否成功
    if ($conn->connect_error) {
        // 在生产环境中, 不应向用户暴露详细的错误信息。
        // 此处应记录到服务器日志中。
        error_log("数据库连接失败: " . $conn->connect_error);
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => false, 'message' => '服务器内部错误: 无法连接到数据库。']);
        exit(); // 终止脚本执行
    }

    // 设置字符集为 utf8mb4
    $conn->set_charset("utf8mb4");

    return $conn;
}

/**
 * 关闭一个 MySQLi 数据库连接。
 * @param mysqli $conn 要关闭的数据库连接对象
 */
function closeDbConnection(mysqli $conn) {
    $conn->close();
}
