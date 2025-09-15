<?php
/**
 * Chog Cross Leaderboard API
 * Handles JSON database operations for the leaderboard system
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Database file path
$dataFile = '../data/leaderboard.json';

/**
 * Load data from JSON file
 */
function loadData() {
    global $dataFile;
    
    if (!file_exists($dataFile)) {
        // Create default data structure
        $defaultData = [
            'games' => [],
            'leaderboard' => [
                'totalWinnings' => [],
                'bestStreak' => [],
                'highestMultiplier' => [],
                'mostRisky' => [],
                'fastestTime' => []
            ],
            'statistics' => [
                'totalGames' => 0,
                'totalWinnings' => 0,
                'averageMultiplier' => 0,
                'lastUpdated' => date('c')
            ]
        ];
        
        // Create directory if it doesn't exist
        $dir = dirname($dataFile);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        
        // Save default data
        file_put_contents($dataFile, json_encode($defaultData, JSON_PRETTY_PRINT));
        return $defaultData;
    }
    
    $json = file_get_contents($dataFile);
    return json_decode($json, true);
}

/**
 * Save data to JSON file
 */
function saveData($data) {
    global $dataFile;
    
    // Update statistics
    $data['statistics']['totalGames'] = count($data['games']);
    $data['statistics']['totalWinnings'] = array_sum(array_column($data['games'], 'winnings'));
    $data['statistics']['averageMultiplier'] = count($data['games']) > 0 
        ? array_sum(array_column($data['games'], 'multiplier')) / count($data['games']) 
        : 0;
    $data['statistics']['lastUpdated'] = date('c');
    
    return file_put_contents($dataFile, json_encode($data, JSON_PRETTY_PRINT));
}

/**
 * Update leaderboards
 */
function updateLeaderboards(&$data, $gameRecord) {
    // Update Total Winnings
    updateTotalWinnings($data, $gameRecord);
    
    // Update Best Streak
    updateBestStreak($data, $gameRecord);
    
    // Update Highest Multiplier
    updateHighestMultiplier($data, $gameRecord);
    
    // Update Most Risky
    updateMostRisky($data, $gameRecord);
    
    // Update Fastest Time
    updateFastestTime($data, $gameRecord);
}

function updateTotalWinnings(&$data, $gameRecord) {
    $existingPlayer = null;
    foreach ($data['leaderboard']['totalWinnings'] as &$player) {
        if ($player['playerName'] === $gameRecord['playerName']) {
            $existingPlayer = &$player;
            break;
        }
    }
    
    if ($existingPlayer) {
        $existingPlayer['totalWinnings'] += $gameRecord['winnings'];
        $existingPlayer['gamesPlayed'] += 1;
    } else {
        $data['leaderboard']['totalWinnings'][] = [
            'playerName' => $gameRecord['playerName'],
            'totalWinnings' => $gameRecord['winnings'],
            'gamesPlayed' => 1
        ];
    }
    
    // Sort by total winnings (descending)
    usort($data['leaderboard']['totalWinnings'], function($a, $b) {
        return $b['totalWinnings'] <=> $a['totalWinnings'];
    });
    
    // Keep only top 10
    $data['leaderboard']['totalWinnings'] = array_slice($data['leaderboard']['totalWinnings'], 0, 10);
}

function updateBestStreak(&$data, $gameRecord) {
    $existingPlayer = null;
    foreach ($data['leaderboard']['bestStreak'] as &$player) {
        if ($player['playerName'] === $gameRecord['playerName']) {
            $existingPlayer = &$player;
            break;
        }
    }
    
    if ($existingPlayer) {
        if ($gameRecord['successfulJumps'] > $existingPlayer['bestStreak']) {
            $existingPlayer['bestStreak'] = $gameRecord['successfulJumps'];
            $existingPlayer['date'] = $gameRecord['date'];
        }
    } else {
        $data['leaderboard']['bestStreak'][] = [
            'playerName' => $gameRecord['playerName'],
            'bestStreak' => $gameRecord['successfulJumps'],
            'date' => $gameRecord['date']
        ];
    }
    
    // Sort by best streak (descending)
    usort($data['leaderboard']['bestStreak'], function($a, $b) {
        return $b['bestStreak'] <=> $a['bestStreak'];
    });
    
    // Keep only top 10
    $data['leaderboard']['bestStreak'] = array_slice($data['leaderboard']['bestStreak'], 0, 10);
}

function updateHighestMultiplier(&$data, $gameRecord) {
    $existingPlayer = null;
    foreach ($data['leaderboard']['highestMultiplier'] as &$player) {
        if ($player['playerName'] === $gameRecord['playerName']) {
            $existingPlayer = &$player;
            break;
        }
    }
    
    if ($existingPlayer) {
        if ($gameRecord['multiplier'] > $existingPlayer['highestMultiplier']) {
            $existingPlayer['highestMultiplier'] = $gameRecord['multiplier'];
            $existingPlayer['betAmount'] = $gameRecord['betAmount'];
            $existingPlayer['date'] = $gameRecord['date'];
        }
    } else {
        $data['leaderboard']['highestMultiplier'][] = [
            'playerName' => $gameRecord['playerName'],
            'highestMultiplier' => $gameRecord['multiplier'],
            'betAmount' => $gameRecord['betAmount'],
            'date' => $gameRecord['date']
        ];
    }
    
    // Sort by highest multiplier (descending)
    usort($data['leaderboard']['highestMultiplier'], function($a, $b) {
        return $b['highestMultiplier'] <=> $a['highestMultiplier'];
    });
    
    // Keep only top 10
    $data['leaderboard']['highestMultiplier'] = array_slice($data['leaderboard']['highestMultiplier'], 0, 10);
}

function updateMostRisky(&$data, $gameRecord) {
    $existingPlayer = null;
    foreach ($data['leaderboard']['mostRisky'] as &$player) {
        if ($player['playerName'] === $gameRecord['playerName']) {
            $existingPlayer = &$player;
            break;
        }
    }
    
    if ($existingPlayer) {
        if ($gameRecord['betAmount'] > $existingPlayer['highestBet']) {
            $existingPlayer['highestBet'] = $gameRecord['betAmount'];
            $existingPlayer['difficulty'] = $gameRecord['difficulty'];
            $existingPlayer['date'] = $gameRecord['date'];
        }
    } else {
        $data['leaderboard']['mostRisky'][] = [
            'playerName' => $gameRecord['playerName'],
            'highestBet' => $gameRecord['betAmount'],
            'difficulty' => $gameRecord['difficulty'],
            'date' => $gameRecord['date']
        ];
    }
    
    // Sort by highest bet (descending)
    usort($data['leaderboard']['mostRisky'], function($a, $b) {
        return $b['highestBet'] <=> $a['highestBet'];
    });
    
    // Keep only top 10
    $data['leaderboard']['mostRisky'] = array_slice($data['leaderboard']['mostRisky'], 0, 10);
}

function updateFastestTime(&$data, $gameRecord) {
    $existingPlayer = null;
    foreach ($data['leaderboard']['fastestTime'] as &$player) {
        if ($player['playerName'] === $gameRecord['playerName']) {
            $existingPlayer = &$player;
            break;
        }
    }
    
    if ($existingPlayer) {
        if ($gameRecord['gameTime'] < $existingPlayer['fastestTime']) {
            $existingPlayer['fastestTime'] = $gameRecord['gameTime'];
            $existingPlayer['jumps'] = $gameRecord['successfulJumps'];
            $existingPlayer['date'] = $gameRecord['date'];
        }
    } else {
        $data['leaderboard']['fastestTime'][] = [
            'playerName' => $gameRecord['playerName'],
            'fastestTime' => $gameRecord['gameTime'],
            'jumps' => $gameRecord['successfulJumps'],
            'date' => $gameRecord['date']
        ];
    }
    
    // Sort by fastest time (ascending)
    usort($data['leaderboard']['fastestTime'], function($a, $b) {
        return $a['fastestTime'] <=> $b['fastestTime'];
    });
    
    // Keep only top 10
    $data['leaderboard']['fastestTime'] = array_slice($data['leaderboard']['fastestTime'], 0, 10);
}

// Handle different HTTP methods
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Get all leaderboard data
        $data = loadData();
        echo json_encode([
            'success' => true,
            'data' => $data
        ]);
        break;
        
    case 'POST':
        // Save new game result
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid JSON data']);
            break;
        }
        
        $data = loadData();
        
        // Generate unique game ID
        $gameId = 'game_' . time() . '_' . uniqid();
        
        // Create game record
        $gameRecord = [
            'id' => $gameId,
            'playerName' => $input['playerName'] ?? 'Player' . rand(100, 999),
            'betAmount' => floatval($input['betAmount'] ?? 1.0),
            'difficulty' => $input['difficulty'] ?? 'easy',
            'multiplier' => floatval($input['multiplier'] ?? 1.0),
            'winnings' => floatval($input['winnings'] ?? 0),
            'successfulJumps' => intval($input['successfulJumps'] ?? 0),
            'gameTime' => intval($input['gameTime'] ?? 0),
            'isWin' => boolval($input['isWin'] ?? false),
            'timestamp' => date('c'),
            'date' => date('Y-m-d')
        ];
        
        // Add to games array
        $data['games'][] = $gameRecord;
        
        // Update leaderboards
        updateLeaderboards($data, $gameRecord);
        
        // Save data
        if (saveData($data)) {
            echo json_encode([
                'success' => true,
                'message' => 'Game result saved successfully',
                'gameId' => $gameId
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to save data']);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        break;
}
?>



