<?php
// backend/utils/response.php
// 描述: 提供标准化的 JSON 响应功能。

/**
 * 发送一个成功的 JSON 响应。
 *
 * @param array|null $data 要包含在响应 'data' 字段中的数据。
 * @param string $message 成功的消息。
 * @param int $statusCode HTTP 状态码, 默认为 200 (OK)。
 */
function sendSuccessResponse($data = null, $message = '操作成功', $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    
    $response = ['success' => true, 'message' => $message];
    if ($data !== null) {
        $response['data'] = $data;
    }
    
    echo json_encode($response);
    exit();
}

/**
 * 发送一个失败的 JSON 响应。
 *
 * @param string $message 错误的详细信息。
 * @param int $statusCode HTTP 状态码, 默认为 400 (Bad Request)。
 * @param array|null $errors 可选的错误详情数组。
 */
function sendErrorResponse($message, $statusCode = 400, $errors = null) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    
    $response = ['success' => false, 'message' => $message];
    if ($errors !== null) {
        $response['errors'] = $errors;
    }
    
    echo json_encode($response);
    exit();
}
