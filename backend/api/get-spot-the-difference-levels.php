<?php
// backend/api/get-spot-the-difference-levels.php
// --- 最终生产版本 (附带强大的错误报告) ---

// 统一的错误和异常捕获机制，确保任何问题都能以JSON格式返回
set_exception_handler(function($e) {
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Exception', 'message' => $e->getMessage(), 'file' => $e->getFile(), 'line' => $e->getLine()]);
    exit;
});
set_error_handler(function($severity, $message, $file, $line) {
    if (!(error_reporting() & $severity)) { return; }
    throw new ErrorException($message, 0, $severity, $file, $line);
});
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error !== null && in_array($error['type'], [E_ERROR, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR])) {
        header('Content-Type: application/json');
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Fatal Error', 'message' => $error['message'], 'file' => $error['file'], 'line' => $error['line']]);
    }
});

require_once '../utils/response.php';

const CLOUDFLARE_WORKER_URL = 'https://render.wenge666.workers.dev/levels';
const R2_PUBLIC_URL_BASE = 'https://pub-5a0d7fbdb4e94d9db5d2a074b6e346e4.r2.dev';

function fetch_url_with_curl($url) {
    if (!function_exists('curl_init')) {
        throw new Exception("Server environment issue: The cURL PHP extension is not installed or enabled.");
    }
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
    $data = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error_msg = curl_error($ch);
    curl_close($ch);

    if ($error_msg) {
        throw new Exception("cURL Error for url '$url': $error_msg");
    }
    if ($http_code >= 400) {
        throw new Exception("HTTP Error $http_code for url '$url'");
    }
    return $data;
}

try {
    $level_ids_json = fetch_url_with_curl(CLOUDFLARE_WORKER_URL);
    $level_ids = json_decode($level_ids_json, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Could not decode JSON from Worker. Raw response: " . htmlspecialchars($level_ids_json));
    }

    if (empty($level_ids)) {
        sendSuccessResponse([]);
        exit;
    }

    $full_levels_data = [];
    shuffle($level_ids);
    $levels_to_fetch = array_slice($level_ids, 0, 15);

    foreach ($levels_to_fetch as $id) {
        // 跳过无效的ID
        if (empty($id)) continue;
        
        $metadata_url = R2_PUBLIC_URL_BASE . '/levels/' . $id . '/metadata.json';
        
        // 我们甚至可以在循环内捕获单个失败，以增加韧性
        try {
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
        } catch (Exception $e) {
            // 如果单个metadata获取失败，我们可以在服务器日志中记录它，然后继续处理下一个
            // error_log("Could not fetch metadata for level $id: " . $e->getMessage());
            continue;
        }
    }

    // 如果所有关卡都获取失败，也要给前端一个明确的空数组
    sendSuccessResponse($full_levels_data);

} catch (Exception $e) {
    // 捕获第一个cURL失败或其他顶级错误
    sendErrorResponse($e->getMessage(), 500);
}
