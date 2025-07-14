<?php
// backend/api/get-spot-the-difference-levels.php
// --- 诊断版本 ---

// 捕获所有类型的错误和异常，确保脚本总能返回JSON
set_exception_handler(function($e) {
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'An uncaught exception occurred: ' . $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
    exit;
});

set_error_handler(function($severity, $message, $file, $line) {
    throw new ErrorException($message, 0, $severity, $file, $line);
});

register_shutdown_function(function() {
    $error = error_get_last();
    if ($error !== null && in_array($error['type'], [E_ERROR, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR])) {
        header('Content-Type: application/json');
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'A fatal error occurred: ' . $error['message'],
            'file' => $error['file'],
            'line' => $error['line']
        ]);
    }
});


require_once '../utils/response.php';

// 您的生产环境地址
const CLOUDFLARE_WORKER_URL = 'https://render.wenge666.workers.dev/levels';
const R2_PUBLIC_URL_BASE = 'https://pub-5a0d7fbdb4e94d9db5d2a074b6e346e4.r2.dev';

// 首先，进行环境自检
if (!function_exists('curl_init')) {
    sendErrorResponse('Server environment issue: The cURL PHP extension is not installed or enabled.', 500);
    exit;
}

function fetch_url_with_curl($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15); // 增加超时时间
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
    $data = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error_msg = curl_error($ch);
    curl_close($ch);

    if ($http_code >= 400) {
        throw new Exception("HTTP Error $http_code for url '$url'. Response: " . $data);
    }
    if ($error_msg) {
        throw new Exception("cURL Error for url '$url': $error_msg");
    }
    return $data;
}

try {
    $level_ids_json = fetch_url_with_curl(CLOUDFLARE_WORKER_URL);
    $level_ids = json_decode($level_ids_json, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Could not decode JSON from Worker. Response: " . htmlspecialchars($level_ids_json));
    }

    if (empty($level_ids)) {
        sendSuccessResponse([]);
        exit;
    }

    $full_levels_data = [];
    shuffle($level_ids);
    $levels_to_fetch = array_slice($level_ids, 0, 10); // 暂时只获取10个以加快调试

    foreach ($levels_to_fetch as $id) {
        $metadata_url = R2_PUBLIC_URL_BASE . '/levels/' . $id . '/metadata.json';
        $metadata_json = fetch_url_with_curl($metadata_url);
        $metadata = json_decode($metadata_json, true);

        if (isset($metadata['differences'])) {
            $full_levels_data[] = [
                'id' => $id,
                'original' => R2_PUBLIC_URL_BASE . '/levels/' . $id . '/original.png',
                'modified' => R2_PUBLIC_URL_BASE . '/levels/' . $id . '/modified.png',
                'differences' => $metadata['differences']
            ];
        }
    }

    sendSuccessResponse($full_levels_data);

} catch (Exception $e) {
    sendErrorResponse('A controlled error occurred: ' . $e->getMessage(), 500);
}
