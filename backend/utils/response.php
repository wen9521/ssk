<?php
// backend/utils/response.php

// --- 解决CORS跨域问题的关键代码 ---
// 定义允许的前端域名
$allowed_origin = 'https://gewe.dpdns.org';

// 检查请求的来源是否是我们允许的域名
if (isset($_SERVER['HTTP_ORIGIN']) && $_SERVER['HTTP_ORIGIN'] === $allowed_origin) {
    header("Access-Control-Allow-Origin: " . $allowed_origin);
} else {
    // 如果你有其他需要允许的源，可以在这里添加逻辑，或者直接设置为 '*' 允许所有
    // header("Access-Control-Allow-Origin: *");
}

header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Accept, Authorization");

// 浏览器在发送复杂请求（如带自定义头的POST）前，会先发送一个OPTIONS预检请求。
// 我们需要响应该请求，告诉浏览器我们的CORS策略，然后立即退出脚本，不执行后面的逻辑。
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(204); // No Content
    exit;
}
// --- CORS代码结束 ---


/**
 * 发送一个标准的成功JSON响应。
 * @param mixed $data - 要在 'data' 键中返回的数据。
 * @param string $message - 成功的消息。
 */
function sendSuccessResponse($data = null, $message = '操作成功') {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'message' => $message,
        'data' => $data
    ]);
    exit;
}

/**
 * 发送一个标准的错误JSON响应。
 * @param string $message - 错误消息。
 * @param int $statusCode - HTTP状态码 (例如 400, 404, 500)。
 */
function sendErrorResponse($message, $statusCode = 400) {
    header('Content-Type: application/json');
    http_response_code($statusCode);
    echo json_encode([
        'success' => false,
        'message' => $message
    ]);
    exit;
}
