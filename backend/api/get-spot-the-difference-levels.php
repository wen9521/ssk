<?php
// backend/api/get-spot-the-difference-levels.php

/**
 * 这个API负责从Cloudflare获取找茬游戏的关卡列表，并返回给前端。
 * 它充当了前端和Cloudflare服务之间的安全中间层。
 */

require_once '../utils/response.php';

// !!! 请在这里填入您自己的真实地址 !!!
// 1. 您在 Cloudflare 账号B 上部署的 Worker 的 URL
const CLOUDFLARE_WORKER_URL = 'https://level-api-worker.yourname.workers.dev/levels'; 
// 2. 您在 Cloudflare 账号B 上的 R2 存储桶的公开访问域名
const R2_PUBLIC_URL_BASE = 'https://pub-xxxxxxxx.r2.dev'; 

try {
    // --- 步骤 1: 从 Cloudflare Worker 获取所有关卡ID ---
    $level_ids_json = @file_get_contents(CLOUDFLARE_WORKER_URL);
    if ($level_ids_json === false) {
        throw new Exception("Could not fetch level index from Cloudflare Worker. Check Worker URL and status.");
    }
    
    $level_ids = json_decode($level_ids_json, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Could not decode level index JSON.");
    }

    // 如果没有关卡，返回空数组
    if (empty($level_ids)) {
        sendSuccessResponse([]);
        exit;
    }

    // --- 步骤 2: 为每个关卡ID获取详细的元数据 (差异点) ---
    $full_levels_data = [];
    // 为避免API调用过多，我们可以随机选择一部分或限制数量，这里我们获取全部
    // shuffle($level_ids); 
    // $level_ids = array_slice($level_ids, 0, 20); // 例如，每次只取20个随机关卡

    foreach ($level_ids as $id) {
        $metadata_url = R2_PUBLIC_URL_BASE . '/levels/' . $id . '/metadata.json';
        
        $metadata_json = @file_get_contents($metadata_url);
        if ($metadata_json === false) {
            // 如果某个关卡的元数据获取失败，就跳过它
            continue;
        }

        $metadata = json_decode($metadata_json, true);
        if (json_last_error() !== JSON_ERROR_NONE || !isset($metadata['differences'])) {
            continue;
        }

        // --- 步骤 3: 组装成前端需要的最终格式 ---
        $full_levels_data[] = [
            'id' => $id,
            'original' => R2_PUBLIC_URL_BASE . '/levels/' . $id . '/original.png',
            'modified' => R2_PUBLIC_URL_BASE . '/levels/' . $id . '/modified.png',
            'differences' => $metadata['differences']
        ];
    }

    // 将关卡数组随机打乱，让玩家每次都有新体验
    shuffle($full_levels_data);

    sendSuccessResponse($full_levels_data);

} catch (Exception $e) {
    // 在生产环境中，应该记录错误日志而不是直接暴露错误信息
    sendErrorResponse('Failed to get game levels: ' . $e->getMessage(), 500);
}
