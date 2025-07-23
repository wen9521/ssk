<?php
// backend/server.php
require dirname(__FILE__) . '/vendor/autoload.php';
require dirname(__FILE__) . '/src/ThirteenWaterRules.php';

use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;
use MyApp\GameServer;
use MyApp\ThirteenWaterRules;

// --- API Endpoint Logic ---
// Check if it's a POST request to our API endpoint
if ($_SERVER['REQUEST_METHOD'] === 'POST' && 
    isset($_SERVER['REQUEST_URI']) && 
    $_SERVER['REQUEST_URI'] === '/api/v1/thirteen-water/calculate') {

    // Set JSON header
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *'); // Allow requests from any origin (for development)
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');

    // Handle pre-flight OPTIONS request for CORS
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }

    // Get the posted JSON data
    $json_data = file_get_contents('php://input');
    $players_data = json_decode($json_data, true);

    // Validate input
    if (json_last_error() !== JSON_ERROR_NONE || !is_array($players_data) || empty($players_data)) {
        http_response_code(400); // Bad Request
        echo json_encode(['error' => 'Invalid JSON data provided.']);
        exit();
    }
    
    try {
        // Calculate scores using our powerful rules engine
        $results = ThirteenWaterRules::calcAllScores($players_data);
        
        // Send back the results
        http_response_code(200);
        echo json_encode($results);
    } catch (Exception $e) {
        http_response_code(500); // Internal Server Error
        echo json_encode(['error' => 'An error occurred during calculation.', 'message' => $e->getMessage()]);
    }

    // Stop script execution for API requests
    exit();
}


// --- WebSocket Server Logic (for future real-time features) ---
// If it's not an API request, fall through to start the WebSocket server.
// Note: In a production environment, you would typically run the API and WebSocket server
// as separate processes or behind a reverse proxy like Nginx.
try {
    echo "Attempting to start WebSocket server...
";
    $port = 8080; // Default WebSocket port
    $server = IoServer::factory(
        new HttpServer(
            new WsServer(
                new GameServer()
            )
        ),
        $port
    );

    echo "WebSocket server could be started on port {$port}. This part of the script is now intended for WebSocket connections.
";
    // To run alongside a web server (like Apache/Nginx), you'd typically run this from CLI: `php server.php`
    // The web server would handle the HTTP API requests.
    // $server->run(); // Uncomment this line when running as a standalone WebSocket server.

} catch (\Exception $e) {
    echo "Error starting WebSocket server: " . $e->getMessage() . "
";
    echo "This is expected if not running from a CLI environment.
";
}
