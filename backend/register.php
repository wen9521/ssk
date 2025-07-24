<?php
// backend/register.php
require_once 'database.php';

header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);

if (empty($data['username']) || empty($data['password'])) {
    echo json_encode(['success' => false, 'message' => 'Username and password are required.']);
    exit;
}

$username = $data['username'];
$password = password_hash($data['password'], PASSWORD_BCRYPT);

try {
    $pdo = getDbConnection();
    $stmt = $pdo->prepare('INSERT INTO users (username, password) VALUES (?, ?)');
    $stmt->execute([$username, $password]);
    echo json_encode(['success' => true, 'message' => 'User registered successfully.']);
} catch (PDOException $e) {
    if ($e->getCode() == 23000) { // Integrity constraint violation (duplicate entry)
        echo json_encode(['success' => false, 'message' => 'Username already exists.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}
