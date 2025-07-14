<?php
// backend/api/get-spot-the-difference-levels.php

// --- 调试模式开启 ---
// 这两行代码会强制服务器显示详细的PHP错误信息，而不是一个通用的HTML错误页。
// 在问题解决后，我们应该移除它们。
ini_set('display_errors', 1);
error_reporting(E_ALL);
// --- 调试模式结束 ---

require_once '../utils/response.php';

// 使用您提供的真实地址
const CLOUDFLARE_WORKER_URL = 'https://render.wenge666.workers.dev/levels';
const R2_PUBLIC_URL_BASE = 'https://pub-5a0d7fbdb4e94d9db5d2a074b6e346e4.r2.dev';

/**
 * 使用 cURL 安全地获取 URL 内容的辅助函数。
 */
function fetch_url_with_curl($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
    $data = curl_exec($ch);
    $error_msg = curl_error($ch);
    $error_no = curl_errno($ch);
    curl_close($ch);

    if ($error_no !== 0) {
        // 如果 cURL 出错，抛出一个包含详细信息的异常
        throw new Exception("cURL Error ($error_no) for url '$url': $error_msg");
    }
    return $data;
}

try {
    $level_ids_json = fetch_url_with_curl(CLOUDFLARE_WORKER_URL);
    
    $level_ids = json_decode($level_ids_json, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Could not decode level index JSON. Worker may have returned an error. Response from worker: " . htmlspecialchars($level_ids_json));
    }

    if (empty($level_ids)) {
        sendSuccessResponse([]);
        exit;
    }

    $full_levels_data = [];
    shuffle($level_ids);
    $levels_to_fetch = array_slice($level_ids, 0, 25);

    foreach ($levels_to_fetch as $id) {
        $metadata_url = R2_PUBLIC_URL_BASE . '/levels/' . $id . '/metadata.json';
        
        $metadata_json = fetch_url_with_curl($metadata_url);
        if ($metadata_json === false) {
            continue;
        }

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
    // 现在这个函数会捕获并显示 cURL 的具体错误
    sendErrorResponse('A fatal error occurred: ' . $e->getMessage(), 500);
}
