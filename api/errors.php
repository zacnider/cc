<?php
/**
 * Error Logging API Endpoint
 * Handles error reporting and logging
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Get request data
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON data']);
    exit();
}

// Validate required fields
$requiredFields = ['level', 'message', 'timestamp', 'sessionId'];
foreach ($requiredFields as $field) {
    if (!isset($data[$field])) {
        http_response_code(400);
        echo json_encode(['error' => "Missing required field: $field"]);
        exit();
    }
}

// Sanitize data
$level = filter_var($data['level'], FILTER_SANITIZE_STRING);
$message = filter_var($data['message'], FILTER_SANITIZE_STRING);
$timestamp = filter_var($data['timestamp'], FILTER_SANITIZE_STRING);
$sessionId = filter_var($data['sessionId'], FILTER_SANITIZE_STRING);
$context = isset($data['context']) ? $data['context'] : [];
$userAgent = isset($data['userAgent']) ? filter_var($data['userAgent'], FILTER_SANITIZE_STRING) : '';
$url = isset($data['url']) ? filter_var($data['url'], FILTER_SANITIZE_URL) : '';
$gameState = isset($data['gameState']) ? $data['gameState'] : [];
$performance = isset($data['performance']) ? $data['performance'] : [];

// Create error log entry
$errorEntry = [
    'id' => uniqid('error_', true),
    'level' => $level,
    'message' => $message,
    'timestamp' => $timestamp,
    'sessionId' => $sessionId,
    'context' => $context,
    'userAgent' => $userAgent,
    'url' => $url,
    'gameState' => $gameState,
    'performance' => $performance,
    'serverTime' => date('Y-m-d H:i:s'),
    'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
];

// Log to file
$logFile = '../data/error_log.json';
$logDir = dirname($logFile);

// Create directory if it doesn't exist
if (!is_dir($logDir)) {
    mkdir($logDir, 0755, true);
}

// Read existing logs
$logs = [];
if (file_exists($logFile)) {
    $logs = json_decode(file_get_contents($logFile), true) ?: [];
}

// Add new error
$logs[] = $errorEntry;

// Keep only last 1000 errors
if (count($logs) > 1000) {
    $logs = array_slice($logs, -1000);
}

// Write back to file
file_put_contents($logFile, json_encode($logs, JSON_PRETTY_PRINT));

// Log critical errors to separate file
if ($level === 'critical' || $level === 'error') {
    $criticalLogFile = '../data/critical_errors.json';
    $criticalLogs = [];
    
    if (file_exists($criticalLogFile)) {
        $criticalLogs = json_decode(file_get_contents($criticalLogFile), true) ?: [];
    }
    
    $criticalLogs[] = $errorEntry;
    
    // Keep only last 100 critical errors
    if (count($criticalLogs) > 100) {
        $criticalLogs = array_slice($criticalLogs, -100);
    }
    
    file_put_contents($criticalLogFile, json_encode($criticalLogs, JSON_PRETTY_PRINT));
}

// Send response
echo json_encode([
    'success' => true,
    'errorId' => $errorEntry['id'],
    'message' => 'Error logged successfully'
]);

// Log to server error log for critical errors
if ($level === 'critical') {
    error_log("CRITICAL ERROR: $message (Session: $sessionId)");
}
?>
