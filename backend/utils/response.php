<?php
// backend/utils/response.php

function setCorsHeaders() {
    error_log("DEBUG: setCorsHeaders 函数开始执行.");
    
    // 确保在任何输出发送之前调用 header()
    if (!headers_sent()) {
        header("Access-Control-Allow-Origin: *");
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization");
        header("Access-Control-Allow-Credentials: true"); // 如果需要支持跨域cookie
    } else {
        error_log("WARNING: 头部已发送，无法设置 CORS 头部。");
    }

    // 记录当前所有已设置的头部
    error_log("DEBUG: 当前已设置的头部:");
    foreach (headers_list() as $header) {
        error_log("DEBUG: - " . $header);
    }

    // 处理 OPTIONS 请求
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        http_response_code(204);
        exit();
    }
    error_log("DEBUG: setCorsHeaders 函数执行完毕.");
}

function sendSuccessResponse($data, $message = "操作成功", $statusCode = 200) {
    header("Content-Type: application/json; charset=UTF-8");
    http_response_code($statusCode);
    echo json_encode(['success' => true, 'message' => $message, 'data' => $data]);
    exit();
}

function sendErrorResponse($message, $statusCode = 500, $details = []) {
    header("Content-Type: application/json; charset=UTF-8");
    http_response_code($statusCode);
    echo json_encode(['success' => false, 'message' => $message, 'details' => $details]);
    exit();
}
?>