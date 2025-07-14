<?php
// backend/utils/response.php

/**
 * 设置CORS（跨域资源共享）所需的HTTP头部。
 * 允许所有来源进行GET, POST, OPTIONS请求，并允许特定的头部。
 */
function setCorsHeaders() {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Accept, Authorization");

    // 浏览器在发送复杂请求（如带自定义头的POST）前，会先发送一个OPTIONS预检请求。
    // 我们需要响应该请求，告诉浏览器我们的CORS策略，然后立即退出脚本，不执行后面的逻辑。
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        http_response_code(204); // No Content
        exit;
    }
}

/**
 * 发送一个标准的成功JSON响应。
 * @param mixed $data - 要在 'data' 键中返回的数据。
 * @param string $message - 成功的消息。
 */
function sendSuccessResponse($data = null, $message = '操作成功') {
    header('Content-Type: application/json');
    http_response_code(200); // 明确设置成功状态码
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
