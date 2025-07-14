<?php
// backend/api/get-spot-the-difference-levels.php
// --- 最终生产版本 ---

require_once '../utils/response.php';

const CLOUDFLARE_WORKER_URL = 'https://render.wenge666.workers.dev/levels';
const R2_PUBLIC_URL_BASE = 'https://pub-5a0d7fbdb4e94d9db5d2a074b6e346e4.r2.dev';

function fetch_url_with_curl($url) {
    if (!function_exists('curl_init')) {
        // 如果没有cURL，静默失败，返回false
        return false;
    }
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    // 伪装成一个常见的浏览器User-Agent，有时可以绕过简单的防火墙规则
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36');
    // 在生产环境中，我们通常需要验证SSL。如果这步失败，说明服务器的证书库有问题。
    // 为了让它能运行，可以暂时禁用验证，但不推荐这样做。
    // curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    $data = curl_exec($ch);
    $error = curl_error($ch);
    curl_close($ch);

    if ($error) {
        // 如果有cURL错误，记录到服务器的错误日志中（如果配置了的话）
        error_log("cURL Error for $url: " . $error);
        return false;
    }
    return $data;
}

$final_levels = [];

try {
    $level_ids_json = fetch_url_with_curl(CLOUDFLARE_WORKER_URL);
    if ($level_ids_json === false) {
        // 如果第一步失败，直接发送空数组
        sendSuccessResponse($final_levels);
        exit;
    }

    $level_ids = json_decode($level_ids_json, true);
    if (json_last_error() !== JSON_ERROR_NONE || !is_array($level_ids)) {
        // 如果JSON解码失败，也发送空数组
        sendSuccessResponse($final_levels);
        exit;
    }
    
    shuffle($level_ids);
    $levels_to_fetch = array_slice($level_ids, 0, 20);

    foreach ($levels_to_fetch as $id) {
        if (empty($id)) continue;
        
        $metadata_url = R2_PUBLIC_URL_BASE . '/levels/' . $id . '/metadata.json';
        $metadata_json = fetch_url_with_curl($metadata_url);
        
        if ($metadata_json !== false) {
            $metadata = json_decode($metadata_json, true);
            if (isset($metadata['differences'])) {
                $final_levels[] = [
                    'id' => $id,
                    'original' => R2_PUBLIC_URL_BASE . '/levels/' . $id . '/original.png',
                    'modified' => R2_PUBLIC_URL_BASE . '/levels/' . $id . '/modified.png',
                    'differences' => $metadata['differences']
                ];
            }
        }
    }

    // 无论中间发生了什么，最终都以一个成功的响应结束，内容是已成功获取的关卡列表
    sendSuccessResponse($final_levels);

} catch (Exception $e) {
    // 捕获任何意外的异常，同样返回空数组
    error_log("Unhandled exception in get-spot-levels: " . $e->getMessage());
    sendSuccessResponse($final_levels);
}
