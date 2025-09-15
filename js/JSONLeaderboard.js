/**
 * JSON Leaderboard Manager
 * Handles all leaderboard operations using local JSON file
 */
function JSONLeaderboard() {
    var _sDataPath = './data/leaderboard.json';
    var _oData = null;
    var _bInitialized = false;

    /**
     * Initialize the JSON leaderboard system
     */
    this.init = function() {
        console.log("📊 Initializing JSON Leaderboard System...");
        this._loadData();
        _bInitialized = true;
        console.log("✅ JSON Leaderboard initialized successfully!");
    };

    /**
     * Load data from JSON file via server API
     */
    this._loadData = function() {
        try {
            // Try to fetch from server first
            fetch('./api/leaderboard.php')
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        _oData = data.data;
                        console.log("📁 JSON data loaded from server successfully");
                    } else {
                        console.error("❌ Server error:", data.error);
                        _oData = this._getDefaultData();
                    }
                })
                .catch(error => {
                    console.log("⚠️ Server not available, using local data");
                    _oData = this._getDefaultData();
                });
        } catch (error) {
            console.error("❌ Error loading JSON data:", error);
            _oData = this._getDefaultData();
        }
    };

    /**
     * Get default data structure
     */
    this._getDefaultData = function() {
        return {
            "games": [],
            "leaderboard": {
                "totalWinnings": [],
                "bestStreak": [],
                "highestMultiplier": [],
                "mostRisky": [],
                "fastestTime": []
            },
            "statistics": {
                "totalGames": 0,
                "totalWinnings": 0,
                "averageMultiplier": 0,
                "lastUpdated": new Date().toISOString()
            }
        };
    };

    /**
     * Save game result to JSON database
     */
    this.saveGameResult = function(gameData) {
        if (!_bInitialized) {
            console.error("❌ JSON Leaderboard not initialized!");
            return false;
        }

        try {
            // Generate unique game ID
            var gameId = "game_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
            
            // Create game record
            var gameRecord = {
                id: gameId,
                playerName: gameData.playerName || "Player" + Math.floor(Math.random() * 1000),
                betAmount: gameData.betAmount || 1.0,
                difficulty: gameData.difficulty || "easy",
                multiplier: gameData.multiplier || 1.0,
                winnings: gameData.winnings || 0,
                successfulJumps: gameData.successfulJumps || 0,
                gameTime: gameData.gameTime || 0,
                isWin: gameData.isWin || false,
                timestamp: new Date().toISOString(),
                date: new Date().toISOString().split('T')[0]
            };

            // Add to games array
            _oData.games.push(gameRecord);

            // Update leaderboards
            this._updateLeaderboards(gameRecord);

            // Update statistics
            this._updateStatistics();

            // Save to file (in real implementation, send to server)
            this._saveToFile();

            console.log("💾 Game result saved to JSON database:", gameRecord);
            return true;

        } catch (error) {
            console.error("❌ Error saving game result:", error);
            return false;
        }
    };

    /**
     * Update all leaderboard categories
     */
    this._updateLeaderboards = function(gameRecord) {
        // Update Total Winnings
        this._updateTotalWinnings(gameRecord);
        
        // Update Best Streak
        this._updateBestStreak(gameRecord);
        
        // Update Highest Multiplier
        this._updateHighestMultiplier(gameRecord);
        
        // Update Most Risky
        this._updateMostRisky(gameRecord);
        
        // Update Fastest Time
        this._updateFastestTime(gameRecord);
    };

    /**
     * Update Total Winnings leaderboard
     */
    this._updateTotalWinnings = function(gameRecord) {
        var existingPlayer = _oData.leaderboard.totalWinnings.find(function(player) {
            return player.playerName === gameRecord.playerName;
        });

        if (existingPlayer) {
            existingPlayer.totalWinnings += gameRecord.winnings;
            existingPlayer.gamesPlayed += 1;
        } else {
            _oData.leaderboard.totalWinnings.push({
                playerName: gameRecord.playerName,
                totalWinnings: gameRecord.winnings,
                gamesPlayed: 1
            });
        }

        // Sort by total winnings (descending)
        _oData.leaderboard.totalWinnings.sort(function(a, b) {
            return b.totalWinnings - a.totalWinnings;
        });

        // Keep only top 10
        _oData.leaderboard.totalWinnings = _oData.leaderboard.totalWinnings.slice(0, 10);
    };

    /**
     * Update Best Streak leaderboard
     */
    this._updateBestStreak = function(gameRecord) {
        var existingPlayer = _oData.leaderboard.bestStreak.find(function(player) {
            return player.playerName === gameRecord.playerName;
        });

        if (existingPlayer) {
            if (gameRecord.successfulJumps > existingPlayer.bestStreak) {
                existingPlayer.bestStreak = gameRecord.successfulJumps;
                existingPlayer.date = gameRecord.date;
            }
        } else {
            _oData.leaderboard.bestStreak.push({
                playerName: gameRecord.playerName,
                bestStreak: gameRecord.successfulJumps,
                date: gameRecord.date
            });
        }

        // Sort by best streak (descending)
        _oData.leaderboard.bestStreak.sort(function(a, b) {
            return b.bestStreak - a.bestStreak;
        });

        // Keep only top 10
        _oData.leaderboard.bestStreak = _oData.leaderboard.bestStreak.slice(0, 10);
    };

    /**
     * Update Highest Multiplier leaderboard
     */
    this._updateHighestMultiplier = function(gameRecord) {
        var existingPlayer = _oData.leaderboard.highestMultiplier.find(function(player) {
            return player.playerName === gameRecord.playerName;
        });

        if (existingPlayer) {
            if (gameRecord.multiplier > existingPlayer.highestMultiplier) {
                existingPlayer.highestMultiplier = gameRecord.multiplier;
                existingPlayer.betAmount = gameRecord.betAmount;
                existingPlayer.date = gameRecord.date;
            }
        } else {
            _oData.leaderboard.highestMultiplier.push({
                playerName: gameRecord.playerName,
                highestMultiplier: gameRecord.multiplier,
                betAmount: gameRecord.betAmount,
                date: gameRecord.date
            });
        }

        // Sort by highest multiplier (descending)
        _oData.leaderboard.highestMultiplier.sort(function(a, b) {
            return b.highestMultiplier - a.highestMultiplier;
        });

        // Keep only top 10
        _oData.leaderboard.highestMultiplier = _oData.leaderboard.highestMultiplier.slice(0, 10);
    };

    /**
     * Update Most Risky leaderboard
     */
    this._updateMostRisky = function(gameRecord) {
        var existingPlayer = _oData.leaderboard.mostRisky.find(function(player) {
            return player.playerName === gameRecord.playerName;
        });

        if (existingPlayer) {
            if (gameRecord.betAmount > existingPlayer.highestBet) {
                existingPlayer.highestBet = gameRecord.betAmount;
                existingPlayer.difficulty = gameRecord.difficulty;
                existingPlayer.date = gameRecord.date;
            }
        } else {
            _oData.leaderboard.mostRisky.push({
                playerName: gameRecord.playerName,
                highestBet: gameRecord.betAmount,
                difficulty: gameRecord.difficulty,
                date: gameRecord.date
            });
        }

        // Sort by highest bet (descending)
        _oData.leaderboard.mostRisky.sort(function(a, b) {
            return b.highestBet - a.highestBet;
        });

        // Keep only top 10
        _oData.leaderboard.mostRisky = _oData.leaderboard.mostRisky.slice(0, 10);
    };

    /**
     * Update Fastest Time leaderboard
     */
    this._updateFastestTime = function(gameRecord) {
        var existingPlayer = _oData.leaderboard.fastestTime.find(function(player) {
            return player.playerName === gameRecord.playerName;
        });

        if (existingPlayer) {
            if (gameRecord.gameTime < existingPlayer.fastestTime) {
                existingPlayer.fastestTime = gameRecord.gameTime;
                existingPlayer.jumps = gameRecord.successfulJumps;
                existingPlayer.date = gameRecord.date;
            }
        } else {
            _oData.leaderboard.fastestTime.push({
                playerName: gameRecord.playerName,
                fastestTime: gameRecord.gameTime,
                jumps: gameRecord.successfulJumps,
                date: gameRecord.date
            });
        }

        // Sort by fastest time (ascending)
        _oData.leaderboard.fastestTime.sort(function(a, b) {
            return a.fastestTime - b.fastestTime;
        });

        // Keep only top 10
        _oData.leaderboard.fastestTime = _oData.leaderboard.fastestTime.slice(0, 10);
    };

    /**
     * Update overall statistics
     */
    this._updateStatistics = function() {
        _oData.statistics.totalGames = _oData.games.length;
        _oData.statistics.totalWinnings = _oData.games.reduce(function(sum, game) {
            return sum + game.winnings;
        }, 0);
        _oData.statistics.averageMultiplier = _oData.games.reduce(function(sum, game) {
            return sum + game.multiplier;
        }, 0) / _oData.games.length;
        _oData.statistics.lastUpdated = new Date().toISOString();
    };

    /**
     * Save data to server
     */
    this._saveToFile = function() {
        // Try to save to server first
        fetch('./api/leaderboard.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(_oData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log("💾 Data saved to server successfully");
            } else {
                console.error("❌ Server save error:", data.error);
            }
        })
        .catch(error => {
            console.log("⚠️ Server not available, backing up locally");
            // Fallback to localStorage
            try {
                localStorage.setItem('chogCrossLeaderboard', JSON.stringify(_oData));
                console.log("💾 Data backed up to localStorage");
            } catch (localError) {
                console.error("❌ Error saving to localStorage:", localError);
            }
        });
    };

    /**
     * Get leaderboard data for specific category
     */
    this.getLeaderboard = function(category) {
        if (!_bInitialized) {
            console.error("❌ JSON Leaderboard not initialized!");
            return [];
        }

        var categories = {
            'totalWinnings': _oData.leaderboard.totalWinnings,
            'bestStreak': _oData.leaderboard.bestStreak,
            'highestMultiplier': _oData.leaderboard.highestMultiplier,
            'mostRisky': _oData.leaderboard.mostRisky,
            'fastestTime': _oData.leaderboard.fastestTime
        };

        return categories[category] || [];
    };

    /**
     * Get all leaderboard data
     */
    this.getAllLeaderboards = function() {
        if (!_bInitialized) {
            console.error("❌ JSON Leaderboard not initialized!");
            return null;
        }

        return _oData.leaderboard;
    };

    /**
     * Get statistics
     */
    this.getStatistics = function() {
        if (!_bInitialized) {
            console.error("❌ JSON Leaderboard not initialized!");
            return null;
        }

        return _oData.statistics;
    };

    /**
     * Get all games
     */
    this.getAllGames = function() {
        if (!_bInitialized) {
            console.error("❌ JSON Leaderboard not initialized!");
            return [];
        }

        return _oData.games;
    };

    /**
     * Check if initialized
     */
    this.isInitialized = function() {
        return _bInitialized;
    };

    /**
     * Export data (for backup or transfer)
     */
    this.exportData = function() {
        if (!_bInitialized) {
            console.error("❌ JSON Leaderboard not initialized!");
            return null;
        }

        return JSON.stringify(_oData, null, 2);
    };

    /**
     * Import data (for restore or transfer)
     */
    this.importData = function(jsonData) {
        try {
            _oData = JSON.parse(jsonData);
            _bInitialized = true;
            console.log("✅ Data imported successfully!");
            return true;
        } catch (error) {
            console.error("❌ Error importing data:", error);
            return false;
        }
    };
}

// Make it globally available
window.jsonLeaderboard = new JSONLeaderboard();
