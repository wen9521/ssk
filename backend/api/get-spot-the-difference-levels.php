<?php
// backend/api/get-spot-the-difference-levels.php

/**
 * 这个API负责从Cloudflare获取找茬游戏的关卡列表，并返回给前端。
 * 它充当了前端和Cloudflare服务之间的安全中间层。
 */

require_once '../utils/response.php';

// 使用您提供的真实地址
const CLOUDFLARE_WORKER_URL = 'https://render.wenge666.workers.dev/levels';
const R2_PUBLIC_URL_BASE = 'https://pub-5a0d7fbdb4e94d9db5d2a074b6e346e4.r2.dev';

/**
 * 使用 cURL 安全地获取 URL 内容的辅助函数。
 * @param string $url
 * @return string|false
 */
function fetch_url_with_curl($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10); // 10秒超时
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true); // 跟随重定向
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true); // 验证SSL证书
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
    $data = curl_exec($ch);
    $error = curl_error($ch);
    curl_close($ch);

    if ($error) {
        // 如果 cURL 出错，可以记录日志或直接返回 false
        // error_log("cURL Error for $url: " . $error);
        return false;
    }
    return $data;
}


try {
    // --- 步骤 1: 从 Cloudflare Worker 获取所有关卡ID ---
    $level_ids_json = fetch_url_with_curl(CLOUDFLARE_WORKER_URL);
    if ($level_ids_json === false) {
        throw new Exception("Could not fetch level index from Cloudflare Worker. Please check the Worker URL and its status. Also, ensure this server can make outbound cURL requests.");
    }
    
    $level_ids = json_decode($level_ids_json, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Could not decode level index JSON. Worker may have returned an error. Response: " . $level_ids_json);
    }

    if (empty($level_ids)) {
        sendSuccessResponse([]);
        exit;
    }

    // --- 步骤 2: 为每个关卡ID获取详细的元数据 ---
    $full_levels_data = [];
    shuffle($level_ids); // 随机打乱ID，让体验更多样
    $levels_to_fetch = array_slice($level_ids, 0, 25); // 每次最多获取25个关卡

    foreach ($levels_to_fetch as $id) {
        $metadata_url = R2_PUBLIC_URL_BASE . '/levels/' . $id . '/metadata.json';
        
        $metadata_json = fetch_url_with_curl($metadata_url);
        if ($metadata_json === false) {
            continue; // 跳过获取失败的关卡
        }

        $metadata = json_decode($metadata_json, true);
        if (json_last_error() !== JSON_ERROR_NONE && isset($metadata['differences'])) {
             // --- 步骤 3: 组装成前端需要的最终格式 ---
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
    sendErrorResponse('Failed to get game levels: ' . $e->getMessage(), 500);
}
