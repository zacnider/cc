<?php
/**
 * Batch Error Logging API Endpoint
 * Handles batch error reporting
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
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
if (!isset($data['sessionId']) || !isset($data['errors'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields: sessionId, errors']);
    exit();
}

$sessionId = filter_var($data['sessionId'], FILTER_SANITIZE_STRING);
$errors = $data['errors'];

if (!is_array($errors)) {
    http_response_code(400);
    echo json_encode(['error' => 'Errors must be an array']);
    exit();
}

// Process each error
$processedErrors = [];
foreach ($errors as $error) {
    if (!isset($error['level']) || !isset($error['message']) || !isset($error['timestamp'])) {
        continue; // Skip invalid errors
    }
    
    $processedErrors[] = [
        'id' => uniqid('error_', true),
        'level' => filter_var($error['level'], FILTER_SANITIZE_STRING),
        'message' => filter_var($error['message'], FILTER_SANITIZE_STRING),
        'timestamp' => filter_var($error['timestamp'], FILTER_SANITIZE_STRING),
        'sessionId' => $sessionId,
        'context' => isset($error['context']) ? $error['context'] : [],
        'userAgent' => isset($error['userAgent']) ? filter_var($error['userAgent'], FILTER_SANITIZE_STRING) : '',
        'url' => isset($error['url']) ? filter_var($error['url'], FILTER_SANITIZE_URL) : '',
        'gameState' => isset($error['gameState']) ? $error['gameState'] : [],
        'performance' => isset($error['performance']) ? $error['performance'] : [],
        'serverTime' => date('Y-m-d H:i:s'),
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
    ];
}

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

// Add new errors
$logs = array_merge($logs, $processedErrors);

// Keep only last 1000 errors
if (count($logs) > 1000) {
    $logs = array_slice($logs, -1000);
}

// Write back to file
file_put_contents($logFile, json_encode($logs, JSON_PRETTY_PRINT));

// Log critical errors to separate file
$criticalErrors = array_filter($processedErrors, function($error) {
    return $error['level'] === 'critical' || $error['level'] === 'error';
});

if (!empty($criticalErrors)) {
    $criticalLogFile = '../data/critical_errors.json';
    $criticalLogs = [];
    
    if (file_exists($criticalLogFile)) {
        $criticalLogs = json_decode(file_get_contents($criticalLogFile), true) ?: [];
    }
    
    $criticalLogs = array_merge($criticalLogs, $criticalErrors);
    
    // Keep only last 100 critical errors
    if (count($criticalLogs) > 100) {
        $criticalLogs = array_slice($criticalLogs, -100);
    }
    
    file_put_contents($criticalLogFile, json_encode($criticalLogs, JSON_PRETTY_PRINT));
}

// Send response
echo json_encode([
    'success' => true,
    'processedCount' => count($processedErrors),
    'criticalCount' => count($criticalErrors),
    'message' => 'Batch errors logged successfully'
]);
?>
