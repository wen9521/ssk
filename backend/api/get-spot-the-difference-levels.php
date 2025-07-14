<?php
// backend/api/get-spot-the-difference-levels.php
// --- 终极诊断版本 ---

// 强制设置响应头为 JSON，这是最重要的一步
header('Content-Type: application/json');

// --- 移除所有外部依赖，避免任何外部文件的干扰 ---
// require_once '../utils/response.php';

const CLOUDFLARE_WORKER_URL = 'https://render.wenge666.workers.dev/levels';
const R2_PUBLIC_URL_BASE = 'https://pub-5a0d7fbdb4e94d9db5d2a074b6e346e4.r2.dev';

function fetch_url_with_curl($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    // 在调试时，可以暂时禁用SSL验证，以排除证书问题
    // curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    $data = curl_exec($ch);
    $error = curl_error($ch);
    curl_close($ch);
    if ($error) {
        return json_encode(['success' => false, 'error' => 'cURL failed', 'message' => $error]);
    }
    return $data;
}

// --- 核心诊断逻辑 ---
// 1. 获取来自 Cloudflare Worker 的原始数据
$raw_worker_response = fetch_url_with_curl(CLOUDFLARE_WORKER_URL);

// 2. 尝试解码
$level_ids = json_decode($raw_worker_response, true);

// 3. 将我们得到的所有信息都打包成一个JSON返回给前端
$debug_output = [
    'step1_worker_response_raw' => $raw_worker_response,
    'step2_worker_response_decoded' => $level_ids,
    'step3_json_last_error' => json_last_error(),
    'step4_json_last_error_msg' => json_last_error_msg()
];

// 直接输出这个诊断JSON并结束脚本
echo json_encode($debug_output);
exit;

// --- 原有的逻辑暂时不执行 ---

/*
try {
    // ... 原有代码 ...
} catch (Exception $e) {
    // ...
}
*/
