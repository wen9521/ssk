<?php
// backend/api/get-spot-the-difference-levels.php
// --- 最终隔离诊断版本 ---

// 在脚本最顶端强制设置响应头，这是我们的第一道防线
header('Content-Type: application/json');

// --- 暂时移除所有外部依赖，确保100%隔离 ---
// require_once '../utils/response.php'; 

const CLOUDFLARE_WORKER_URL = 'https://render.wenge666.workers.dev/levels';
const R2_PUBLIC_URL_BASE = 'https://pub-5a0d7fbdb4e94d9db5d2a074b6e346e4.r2.dev';

function fetch_url_with_curl($url) {
    if (!function_exists('curl_init')) {
        // 如果没有cURL，返回一个JSON错误字符串
        return json_encode(['success' => false, 'error' => 'cURL PHP extension not available.']);
    }
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    $data = curl_exec($ch);
    $error = curl_error($ch);
    curl_close($ch);
    if ($error) {
        return json_encode(['success' => false, 'error' => "cURL failed for $url", 'message' => $error]);
    }
    return $data;
}

// --- 核心诊断逻辑 ---

// 1. 获取关卡ID列表
$level_ids_json = fetch_url_with_curl(CLOUDFLARE_WORKER_URL);
$level_ids = json_decode($level_ids_json, true);

// 2. 检查第一步是否成功，并且列表不为空
if (is_array($level_ids) && !empty($level_ids)) {
    // 只取第一个ID进行测试
    $first_level_id = $level_ids[0];
    $metadata_url = R2_PUBLIC_URL_BASE . '/levels/' . $first_level_id . '/metadata.json';

    // 3. 尝试获取第一个关卡的元数据
    $metadata_json = fetch_url_with_curl($metadata_url);
    $metadata_decoded = json_decode($metadata_json, true);

    // 4. 将所有诊断信息打包成一个JSON输出
    $debug_output = [
        'test_point' => 'final_diagnosis',
        'worker_url_called' => CLOUDFLARE_WORKER_URL,
        'received_level_ids' => $level_ids,
        'first_level_id_to_test' => $first_level_id,
        'metadata_url_called' => $metadata_url,
        'received_metadata_raw' => $metadata_json,
        'received_metadata_decoded' => $metadata_decoded,
        'metadata_json_last_error' => json_last_error_msg()
    ];
} else {
    // 如果第一步就失败了，报告第一步的错误
    $debug_output = [
        'test_point' => 'initial_fetch_failed',
        'worker_url_called' => CLOUDFLARE_WORKER_URL,
        'raw_response_from_worker' => $level_ids_json
    ];
}

// 用最原始的方式输出JSON并结束
echo json_encode($debug_output);
exit;
