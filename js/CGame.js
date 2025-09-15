function CGame(oData, iLevel) {
    var _bUpdate;
    var _bJumping;
    var _oInterface;
    var _oObstacleManager;
    var _oCharacterManager;
    var _bTapping;
    var _iTappingTime;
    var _iScore;
    var _bCollision;
    var _oCollision;
    var _bUpdateObst;
    var _iBestScore;
    var _iWorld;
    var _bGameOver;
    var _iJumpsLeft; // Kalan atlama sayısı
    var _iCurrentMultiplier; // Mevcut multiplier
    
    // Gambling system variables
    var _fBetAmount = 1.0; // Default bet amount (now supports decimals)
    var _iCurrentLevel = iLevel || 1;
    var _fCurrentWinnings = 0;
    var _bShowingBetUI = true; // Show bet UI at start
    var _sDifficulty = "easy"; // Default difficulty
    var _fCurrentMultiplier = 1.0; // Current multiplier
    var _bGameStarted = false; // Game started flag
    var _iSuccessfulJumps = 0; // Count of successful jumps
    var _iGameStartTime = 0; // Game start timestamp
    var _bCashoutInProgress = false; // Cashout işlemi devam ediyor mu

    var _oBackground; // Arka plan referansı için global değişken
    var _oStartingPlatform; // Starting platform reference
    var _oRiverAnimation;
    var _oSharkAnimation; // Nehir animasyonu referansı
    var _oSharkAttackAnimation; // Shark attack animasyonu referansı
    
    // Public getter for starting platform
    this.getStartingPlatform = function() {
        return _oStartingPlatform;
    };
    
    this._init = function () {
        try {
            _bTapping = false;
            _bJumping = false;
            
            _iJumpsLeft = MAX_JUMPS;
            _iCurrentMultiplier = 1;
            
            // Log game initialization
            if (window.errorLogger) {
                window.errorLogger.info('Game initialization started', {
                    jumpsLeft: _iJumpsLeft,
                    currentMultiplier: _iCurrentMultiplier,
                    betAmount: _fBetAmount,
                    difficulty: _sDifficulty
                });
            }
        
        var aBackgroundsImages = new Array("bg_game", "bg_game_1", "bg_game_2"); // Hepsi bg3.png olacak
        _bGameOver = false; // Oyun başladığında false olmalı
        _iWorld = Math.floor(randomFloatBetween(0, aBackgroundsImages.length));
        setVolume("soundtrack", 0.4);
        // Arkaplan oluştur - RESPONSIVE SCALING
        _oBackground = createBitmap(s_oSpriteLibrary.getSprite(aBackgroundsImages[_iWorld]));
        _oBackground.x = CANVAS_WIDTH/2;
        _oBackground.y = CANVAS_HEIGHT/2;
        // Arkaplanı tam ekrana oturt - regX ve regY ayarla
        _oBackground.regX = _oBackground.getBounds().width/2;
        _oBackground.regY = _oBackground.getBounds().height/2;
        // RESPONSIVE STRETCH - Canvas boyutlarına göre scale et
        var scaleX = CANVAS_WIDTH / _oBackground.getBounds().width;
        var scaleY = CANVAS_HEIGHT / _oBackground.getBounds().height;
        _oBackground.scaleX = scaleX; // X eksenini canvas genişliğine göre scale et
        _oBackground.scaleY = scaleY; // Y eksenini canvas yüksekliğine göre scale et
        s_oStage.addChild(_oBackground);

        
         
        if (getItem(SCORE_ITEM_NAME) !== null)
        {
            _iBestScore = getItem(SCORE_ITEM_NAME);
        }
        else
        {
            _iBestScore = 0;
        }
        _iScore = 0;
        _oObstacleManager = new CObstacle(s_oSpriteLibrary.getSprite("platform_spritesheet"));
        _oCharacterManager = new CCharacter(STARTX, STARTY, s_oSpriteLibrary.getSprite("hero_idle"));
        // Create starting platform where character begins - smaller and higher
        _oStartingPlatform = createBitmap(s_oSpriteLibrary.getSprite("first_platform"));
        _oStartingPlatform.x = STARTX;
        _oStartingPlatform.y = FIRST_PLATFORM_Y; // Responsive pozisyon
        _oStartingPlatform.regX = _oStartingPlatform.getBounds().width / 2;
        _oStartingPlatform.regY = _oStartingPlatform.getBounds().height / 2;
        _oStartingPlatform.scaleX = 1.0; // 50% smaller
        _oStartingPlatform.scaleY = 1.0; // 50% smaller
        s_oStage.addChild(_oStartingPlatform);
        
        // Nehir animasyonunu başlat
        _oRiverAnimation = new CRiverAnimation();
        
        // Shark animasyonunu başlat
        _oSharkAnimation = new CSharkAnimation();
        
        // Shark attack animasyonunu başlat
        _oSharkAttackAnimation = new CSharkAttackAnimation();

        _oInterface = new CInterface(_iBestScore);
        
        // Z ekseni sıralamasını ayarla
        this.setupZOrder();
        
        // Show betting UI after help panel is created (delay to ensure it's on top)
        var self = this;
        setTimeout(function() {
            _oInterface.showBettingUI(_fBetAmount, _iCurrentLevel);
        }, 100);

        _oObstacleManager.update(0);

        _iTappingTime = 0;
        _bCollision = false;
        _oCollision = null;

        // Space tuşu event listener'ı ekle
        this._initKeyboardEvents();

        // Register with GameManager
        if (window.gameManager) {
            window.gameManager.setGame(this);
            
            // Log game creation
            if (window.errorLogger) {
                window.errorLogger.info('Game instance registered with GameManager', {
                    betAmount: _fBetAmount,
                    difficulty: _sDifficulty,
                    level: _iCurrentLevel
                });
            }
        }

        _bUpdate = true;
        _bUpdateObst = true;
        
        console.log("Game initialized - character should be on first log waiting for input"); // Debug
        console.log("Initial jumps left:", _iJumpsLeft); // Debug
        console.log("Initial game over:", _bGameOver); // Debug
        
        } catch (error) {
            if (window.errorLogger) {
                window.errorLogger.error('Game initialization failed', {
                    error: error.message,
                    stack: error.stack,
                    jumpsLeft: _iJumpsLeft,
                    betAmount: _fBetAmount,
                    difficulty: _sDifficulty
                });
            }
            
            // Show user-friendly error
            if (window.errorLogger) {
                window.errorLogger.showErrorToUser('Oyun başlatılamadı. Lütfen sayfayı yenileyin.');
            }
            
            throw error; // Re-throw to maintain original behavior
        }
    };

    // Space tuşu desteği
    this._initKeyboardEvents = function() {
        var self = this;
        $(document).keydown(function(e) {
            if (e.keyCode === 32) { // Space tuşu
                e.preventDefault();
                if (!_bJumping && _iJumpsLeft > 0) {
                    self.tapScreen();
                }
            }
        });
    };


    this.unload = function () {
        _oInterface.unload();
        if (_oStartingPlatform) {
            s_oStage.removeChild(_oStartingPlatform);
            _oStartingPlatform = null;
        }
        s_oStage.removeAllChildren();

        s_oGame = null;
    };
    this.restart = function () {
        _oInterface.unload();
        s_oStage.removeAllChildren();
        this._init();
    };

    this.gameOver = function ()
    {
        _bGameOver = true;
        
        // Disable cashout button when game is over
        if (_oInterface && _oInterface.disableCashoutButton) {
            _oInterface.disableCashoutButton();
        }
        
        // Hide multiplier texts when game is over
        if (_oObstacleManager && _oObstacleManager.removeMultiplierTextsFromStage) {
            _oObstacleManager.removeMultiplierTextsFromStage();
            console.log("🎯 Platform multipliers hidden when game over");
        }
        
        // Shark attack animasyonunu başlat (fail durumunda)
        this.startSharkAttack();
        
        if (_bGameOver)
        {
            // Sadece splash sesi çal (fail durumunda)
            playSound("splash",1,false);
            _bUpdateObst = false;
            
            // Hide game UI and show gambling screen again
            if (_bGameStarted) {
                _oInterface.hideGameUI();
                console.log("Game Over! Shark attack animation will show game over screen when finished...");
                
                // Achievement checking removed
                
                // Game over ekranı shark attack animasyonu bittikten sonra gösterilecek
            } else {
                // Original game over behavior for non-gambling mode
                _oInterface.gameOver();
                if (_iScore > getItem(SCORE_ITEM_NAME)) {
                    saveItem(SCORE_ITEM_NAME, _iScore);
                }
                // Non-gambling mode'da game over flag'ini sıfırla
                _bGameOver = false;
            }
        }
    };
    this.increaseScore = function () {
       _iScore += _iCurrentMultiplier;
       _oInterface.refreshScore(_iScore);
       _bJumping = false;
    };
    this.getScore = function () 
    {
      return _iScore; 
    };
    
    // Achievement checking methods removed
    
    this.getJumpsLeft = function () 
    {
      return _iJumpsLeft; 
    };
    
    this.getCurrentMultiplier = function () 
    {
      return _iCurrentMultiplier; 
    };
    this.onExit = function () {
        setVolume("soundtrack", 1);

        s_oGame.unload();
        s_oMain.gotoMenu();

        $(s_oMain).trigger("end_session");
        $(s_oMain).trigger("save_score", _iScore);

        $(s_oMain).trigger("show_interlevel_ad");
    };
    this.getNextXPos = function (){
        return _oObstacleManager.getNextXPos();
    };

    this.updateCollidables = function (){
        return _oObstacleManager.getArray();
    };

    // Kamera takip sistemi için sadece arka plan kaydırma fonksiyonu (UI elementleri hariç)
    // Arka plan ve oyun elementleri SABİT KALACAK - kamera takip sistemi kaldırıldı
    // Karakter platformlara zıplayarak ilerleyecek
this.getCharacterManager = function (){
    return _oCharacterManager;
};

this.setupZOrder = function() {
    console.log("Setting up Z order...");
    console.log("Total children on stage:", s_oStage.numChildren);
    
    // Z ekseni sıralaması: En arkadan en öne
    // 1. Background (en arka)
    if (_oBackground) {
        s_oStage.setChildIndex(_oBackground, 0);
        console.log("Background moved to index 0 (back)");
    }
    
    // 2. First platform (arka)
    if (_oStartingPlatform) {
        s_oStage.setChildIndex(_oStartingPlatform, 1);
        console.log("First platform moved to index 1");
    }
    
    // 3. Diğer platformlar (nehirden önce)
    if (_oObstacleManager) {
        var obstacles = _oObstacleManager.getArray();
        for (var i = 0; i < obstacles.length; i++) {
            s_oStage.setChildIndex(obstacles[i], 2 + i);
        }
        console.log("Platforms moved to indices 2+");
    }
    
    // 4. Nehir animasyonu (platformlardan sonra)
    if (_oRiverAnimation && _oRiverAnimation.getContainer) {
        var riverContainer = _oRiverAnimation.getContainer();
        if (riverContainer) {
            s_oStage.setChildIndex(riverContainer, 2 + obstacles.length);
            console.log("River animation moved to index", 2 + obstacles.length);
        }
    }
    
    // 5. Köpek balığı animasyonu (nehirden sonra)
    if (_oSharkAnimation && _oSharkAnimation.getContainer) {
        var sharkContainer = _oSharkAnimation.getContainer();
        if (sharkContainer) {
            s_oStage.setChildIndex(sharkContainer, 3 + obstacles.length);
            console.log("Shark animation moved to index", 3 + obstacles.length);
        }
    }
    
    // 6. Karakter (tüm platformların üzerinde - en ön)
    var characterSprite = _oCharacterManager.getSprite();
    if (characterSprite) {
        s_oStage.setChildIndex(characterSprite, s_oStage.numChildren - 1);
        console.log("Character moved to index", s_oStage.numChildren - 1, "(front - above all platforms)");
    }
    
    console.log("Z order setup complete: Background -> First Platform -> Other Platforms -> River -> Shark -> Character (front)");
};

this.hideCharacter = function() {
    if (_oCharacterManager && _oCharacterManager.getSprite) {
        var characterSprite = _oCharacterManager.getSprite();
        if (characterSprite) {
            characterSprite.alpha = 0;
            console.log("Character hidden via CGame.hideCharacter()");
        }
    }
};

this.showCharacter = function() {
    if (_oCharacterManager && _oCharacterManager.getSprite) {
        var characterSprite = _oCharacterManager.getSprite();
        if (characterSprite) {
            characterSprite.alpha = 1.0;
            console.log("Character shown via CGame.showCharacter()");
        }
    }
};

this.getObstacleManager = function (){
    return _oObstacleManager;
};

// Save game result to JSON leaderboard and update social features
    this._saveGameResultToJSON = function(gameData) {
        try {
            // Save to JSON leaderboard
            if (window.jsonLeaderboard && window.jsonLeaderboard.isInitialized()) {
                window.jsonLeaderboard.saveGameResult(gameData);
                console.log("💾 Game result saved to JSON database:", gameData);
            } else {
                console.log("JSON Leaderboard not available, skipping save");
            }
            
            // Social features update removed
        } catch (error) {
            console.error("Error saving game result to JSON database:", error);
        }
    };

    // Calculate multiplier based on level, jumps left, and bet amount
    this.calculateMultiplier = function(iJumpsLeft, iLevel, iBetAmount) {
        // Base multiplier increases with each successful jump
        var fBaseMultiplier = 1.0 + (MAX_JUMPS - iJumpsLeft) * 0.5;
        
        // Level bonus (higher levels = higher multipliers)
        var fLevelBonus = 1.0 + (iLevel - 1) * 0.2;
        
        // Bet amount affects risk/reward ratio
        var fBetMultiplier = 1.0 + (iBetAmount - 1) * 0.1;
        
        var fFinalMultiplier = fBaseMultiplier * fLevelBonus * fBetMultiplier;
        
        // Ensure maximum winnings don't exceed 100 MON
        var fMaxMultiplier = 100 / iBetAmount;
        return Math.min(fFinalMultiplier, fMaxMultiplier);
    };
    
    // Betting UI functions
    // Betting UI functions - now supports decimal values
    this.setBetAmount = function(fBetAmount) {
        if (fBetAmount >= 1.0 && fBetAmount <= 5.0) {
            _fBetAmount = parseFloat(fBetAmount.toFixed(1)); // Round to 1 decimal place
            
            // Update multipliers if game is not started yet (during betting phase)
            if (!_bGameStarted && _oObstacleManager) {
                _oObstacleManager.updateMultipliers(_fBetAmount, _sDifficulty);
            }
        }
    };
    
    this.decreaseBet = function() {
        console.log("decreaseBet called - Current bet:", _fBetAmount);
        if (_fBetAmount > 1.0) {
            var oldBet = _fBetAmount;
            _fBetAmount = parseFloat((_fBetAmount - 0.1).toFixed(1));
            if (_fBetAmount < 1.0) _fBetAmount = 1.0;
            
            console.log("Bet decreased from", oldBet, "to", _fBetAmount);
            
            // Update UI
            _oInterface.updateBetAmount(_fBetAmount);
            
            // Update multipliers if game is not started yet (during betting phase)
            if (!_bGameStarted && _oObstacleManager) {
                _oObstacleManager.updateMultipliers(_fBetAmount, _sDifficulty);
            }
        } else {
            console.log("Cannot decrease bet - already at minimum (1.0)");
        }
    };
    
    this.increaseBet = function() {
        console.log("=== INCREASE BET CALLED ===");
        console.log("Current bet:", _fBetAmount);
        console.log("Stack trace:", new Error().stack);
        
        if (_fBetAmount < 5.0) {
            var oldBet = _fBetAmount;
            _fBetAmount = parseFloat((_fBetAmount + 0.1).toFixed(1));
            if (_fBetAmount > 5.0) _fBetAmount = 5.0;
            
            console.log("Bet increased from", oldBet, "to", _fBetAmount);
            
            // Update UI
            _oInterface.updateBetAmount(_fBetAmount);
            
            // Update multipliers if game is not started yet (during betting phase)
            if (!_bGameStarted && _oObstacleManager) {
                _oObstacleManager.updateMultipliers(_fBetAmount, _sDifficulty);
            }
        } else {
            console.log("Cannot increase bet - already at maximum (5.0)");
        }
    };
    
    this.getBetAmount = function() {
        return _fBetAmount;
    };
    
    this.getDifficulty = function() {
        return _sDifficulty;
    };
    
    this.getCurrentMultiplier = function() {
        return _fCurrentMultiplier;
    };
    
    // Shark attack animasyonunu başlat (fail durumunda)
    this.startSharkAttack = function() {
        if (_oSharkAttackAnimation && !_oSharkAttackAnimation.isActive()) {
            _oSharkAttackAnimation.startAttack();
        }
    };
    
    // Shark attack animasyonunu durdur
    this.stopSharkAttack = function() {
        if (_oSharkAttackAnimation && _oSharkAttackAnimation.isActive()) {
            _oSharkAttackAnimation.endAttack();
        }
    };
    
    // Game over ekranını göster
    this.showGameOverScreen = function() {
        console.log("Showing game over screen - Bet lost:", _fBetAmount, "MON");
        
        // Cüzdan entegrasyonu - kayıp işle
        if (window.walletManager) {
            window.walletManager.processLoss(_fBetAmount);
        }
        
        // Oyun güncellemelerini durdur
        _bUpdate = false;
        _bUpdateObst = false;
        
        // Game over ekranı oluştur
        this.createGameOverScreen();
    };
    
    // Game over ekranı oluştur
    this.createGameOverScreen = function() {
        // Arka plan (yarı şeffaf siyah)
        var gameOverBg = new createjs.Shape();
        gameOverBg.graphics.beginFill("rgba(0,0,0,0.8)").drawRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        gameOverBg.x = 0;
        gameOverBg.y = 0;
        gameOverBg.alpha = 0;
        
        // Ana container
        var gameOverContainer = new createjs.Container();
        gameOverContainer.x = CANVAS_WIDTH / 2;
        gameOverContainer.y = CANVAS_HEIGHT / 2;
        gameOverContainer.alpha = 0;
        
        // Ana panel (betting UI stili)
        var mainPanel = new createjs.Shape();
        mainPanel.graphics.beginLinearGradientFill(
            ["#4A0E4E", "#2D1B69", "#1A0B3D"], 
            [0, 0.5, 1], 
            0, 0, 0, 400
        ).drawRoundRect(-200, -150, 400, 300, 20);
        
        // Altın border
        var panelBorder = new createjs.Shape();
        panelBorder.graphics.beginStroke("#FFD700").setStrokeStyle(4).drawRoundRect(-200, -150, 400, 300, 20);
        
        // Başlık
        var titleText = new createjs.Text("💀 GAME OVER 💀", "bold 32px " + PRIMARY_FONT, "#FF4444");
        titleText.textAlign = "center";
        titleText.textBaseline = "middle";
        titleText.x = 0;
        titleText.y = -100;
        titleText.shadow = new createjs.Shadow("#000000", 3, 3, 6);
        
        // Kayıp miktarı
        var lossText = new createjs.Text("You lost:", "bold 24px " + PRIMARY_FONT, "#FFFFFF");
        lossText.textAlign = "center";
        lossText.textBaseline = "middle";
        lossText.x = 0;
        lossText.y = -50;
        lossText.shadow = new createjs.Shadow("#000000", 2, 2, 4);
        
        // Bet miktarı
        var betAmountText = new createjs.Text(_fBetAmount.toFixed(1) + " MON", "bold 36px " + PRIMARY_FONT, "#FF4444");
        betAmountText.textAlign = "center";
        betAmountText.textBaseline = "middle";
        betAmountText.x = 0;
        betAmountText.y = -10;
        betAmountText.shadow = new createjs.Shadow("#000000", 3, 3, 6);
        
        // Başarılı zıplama sayısı
        var jumpsText = new createjs.Text("Successful jumps: " + _iSuccessfulJumps, "bold 20px " + PRIMARY_FONT, "#CCCCCC");
        jumpsText.textAlign = "center";
        jumpsText.textBaseline = "middle";
        jumpsText.x = 0;
        jumpsText.y = 30;
        jumpsText.shadow = new createjs.Shadow("#000000", 2, 2, 4);
        
        // Yeniden oyna butonu - sadece yazı animasyonu
        var playAgainText = new createjs.Text("PLAY AGAIN", "bold 18px " + PRIMARY_FONT, "#FFD700");
        playAgainText.textAlign = "center";
        playAgainText.textBaseline = "middle";
        playAgainText.x = 0;
        playAgainText.y = 50; // Yukarı kaydırıldı
        
        // Play Again yazı animasyonları
        playAgainText.cursor = "pointer";
        var playAgainHovered = false;
        
        playAgainText.on("mouseover", function() {
            if (!playAgainHovered) {
                playAgainHovered = true;
                createjs.Tween.get(playAgainText).to({scaleX: 1.05, scaleY: 1.05}, 200, createjs.Ease.quadOut);
            }
        });
        
        playAgainText.on("mouseout", function() {
            playAgainHovered = false;
            createjs.Tween.get(playAgainText).to({scaleX: 1, scaleY: 1}, 200, createjs.Ease.quadOut);
        });
        
        playAgainText.on("mousedown", function() {
            createjs.Tween.get(playAgainText).to({scaleX: 0.95, scaleY: 0.95}, 100, createjs.Ease.quadOut);
        });
        
        playAgainText.on("pressup", function() {
            createjs.Tween.get(playAgainText).to({scaleX: 1, scaleY: 1}, 100, createjs.Ease.quadOut);
        });
        
        // Ana menü butonu - sadece yazı animasyonu
        var menuText = new createjs.Text("BACK TO MENU", "bold 18px " + PRIMARY_FONT, "#FF6666");
        menuText.textAlign = "center";
        menuText.textBaseline = "middle";
        menuText.x = 0;
        menuText.y = 90; // Yukarı kaydırıldı
        
        // Main Menu yazı animasyonları
        menuText.cursor = "pointer";
        var menuHovered = false;
        
        menuText.on("mouseover", function() {
            if (!menuHovered) {
                menuHovered = true;
                createjs.Tween.get(menuText).to({scaleX: 1.05, scaleY: 1.05}, 200, createjs.Ease.quadOut);
            }
        });
        
        menuText.on("mouseout", function() {
            menuHovered = false;
            createjs.Tween.get(menuText).to({scaleX: 1, scaleY: 1}, 200, createjs.Ease.quadOut);
        });
        
        menuText.on("mousedown", function() {
            createjs.Tween.get(menuText).to({scaleX: 0.95, scaleY: 0.95}, 100, createjs.Ease.quadOut);
        });
        
        menuText.on("pressup", function() {
            createjs.Tween.get(menuText).to({scaleX: 1, scaleY: 1}, 100, createjs.Ease.quadOut);
        });
        
        // Container'a ekle
        gameOverContainer.addChild(mainPanel);
        gameOverContainer.addChild(panelBorder);
        gameOverContainer.addChild(titleText);
        gameOverContainer.addChild(lossText);
        gameOverContainer.addChild(betAmountText);
        gameOverContainer.addChild(jumpsText);
        gameOverContainer.addChild(playAgainText);
        gameOverContainer.addChild(menuText);
        
        // Stage'e ekle
        s_oStage.addChild(gameOverBg);
        s_oStage.addChild(gameOverContainer);
        
        // Animasyon
        createjs.Tween.get(gameOverBg).to({alpha: 1}, 500, createjs.Ease.quadOut);
        createjs.Tween.get(gameOverContainer)
            .to({alpha: 1, scaleX: 1.1, scaleY: 1.1}, 400, createjs.Ease.backOut)
            .to({scaleX: 1, scaleY: 1}, 200, createjs.Ease.elasticOut);
        
        // Buton event'leri
        playAgainText.on("click", function() {
            this.restartGame();
        }.bind(this));
        
        menuText.on("click", function() {
            this.goToMainMenu();
        }.bind(this));
        
        // Global referanslar
        this._gameOverBg = gameOverBg;
        this._gameOverContainer = gameOverContainer;
    };
    
    // Oyunu yeniden başlat
    this.restartGame = function() {
        console.log("Restarting game...");
        
        // Game over ekranını kaldır
        if (this._gameOverBg) {
            s_oStage.removeChild(this._gameOverBg);
            this._gameOverBg = null;
        }
        if (this._gameOverContainer) {
            s_oStage.removeChild(this._gameOverContainer);
            this._gameOverContainer = null;
        }
        
        // Game over flag'ini sıfırla
        _bGameOver = false;
        
        // Game started flag'ini de sıfırla (yeni oyun için)
        _bGameStarted = false;
        
        // Oyun güncellemelerini tekrar başlat
        _bUpdate = true;
        _bUpdateObst = true;
        
        // Shark attack'ı durdur
        this.stopSharkAttack();
        
        // Karakteri tekrar göster (yeni oyun için)
        this.showCharacter();
        
        // Reset character and platforms to starting positions (bu tüm game state'leri de resetler)
        this.resetGameElements();
        
        // Show betting UI again
        setTimeout(function() {
            _oInterface.showBettingUI(_fBetAmount, _iCurrentLevel);
            // Wallet'ı tekrar göster
            if (_oInterface.showWallet) {
                _oInterface.showWallet();
                console.log("👁️ Wallet shown after game over");
            }
        }, 100);
    };
    
    // Ana menüye dön
    this.goToMainMenu = function() {
        console.log("Going to main menu...");
        
        // Game over ekranını kaldır
        if (this._gameOverBg) {
            s_oStage.removeChild(this._gameOverBg);
            this._gameOverBg = null;
        }
        if (this._gameOverContainer) {
            s_oStage.removeChild(this._gameOverContainer);
            this._gameOverContainer = null;
        }
        
        // Game over flag'ini sıfırla
        _bGameOver = false;
        
        // Shark attack'ı durdur
        this.stopSharkAttack();
        
        // Iframe içindeyse parent'a mesaj gönder, değilse normal exit
        if (window.parent && window.parent !== window) {
            // Iframe içindeyiz, parent'a mesaj gönder
            console.log("Sending message to parent window...");
            window.parent.postMessage({
                type: 'goToMainMenu',
                action: 'exit'
            }, '*');
        } else {
            // Normal sayfa, normal exit
            this.onExit();
        }
    };
    
    this.setDifficulty = function(sDifficulty) {
        _sDifficulty = sDifficulty;
        console.log("Difficulty set to:", _sDifficulty);
        
        // Update multipliers if game is not started yet (during betting phase)
        if (!_bGameStarted && _oObstacleManager) {
            _oObstacleManager.updateMultipliers(_fBetAmount, _sDifficulty);
        }
    };
    
    // Start game after betting UI
    this.startGameplay = function() {
        // Prevent multiple calls
        if (_bGameStarted) {
            console.log("Game already started, ignoring startGameplay call");
            return;
        }
        
        _bShowingBetUI = false;
        _bGameStarted = true;
        
        // Wallet'ı gizle (oyun başladığında) ama toggle butonunu aktif bırak
        if (_oInterface && _oInterface.hideWalletForGameplay) {
            _oInterface.hideWalletForGameplay();
            console.log("🙈 Wallet hidden for gameplay (toggle button remains active)");
        }
        _iSuccessfulJumps = 0;
        _fCurrentMultiplier = 1.0;
        _bGameOver = false; // Reset game over flag when starting new game
        _iGameStartTime = new Date().getTime(); // Set game start time
        _oInterface.hideBettingUI();
        
        // Update platform multipliers based on bet amount and difficulty
        _oObstacleManager.updateMultipliers(_fBetAmount, _sDifficulty);
        
        // Show multiplier texts when game starts
        if (_oObstacleManager && _oObstacleManager.addMultiplierTextsToStage) {
            _oObstacleManager.addMultiplierTextsToStage();
            console.log("🎯 Platform multipliers shown when game started");
        }
        
        // Show game UI
        _oInterface.showGameUI(_fBetAmount, _sDifficulty, _fCurrentMultiplier);
        
        // Enable cashout button when game starts
        if (_oInterface && _oInterface.enableCashoutButton) {
            _oInterface.enableCashoutButton();
        }
        
        console.log("Starting gameplay with bet:", _fBetAmount, "difficulty:", _sDifficulty);
    };
    
    // Calculate current multiplier based on successful jumps, bet amount, and difficulty
    this.calculateCurrentMultiplier = function() {
        // Base multiplier starts at 1.3 (minimum multiplier, no 1.0x platforms)
        var baseMultiplier = 1.3;
        
        // Jump bonus: each successful jump adds 0.3x
        var jumpBonus = _iSuccessfulJumps * 0.3;
        
        // Difficulty bonus: Hard mode gives extra multiplier
        var difficultyBonus = (_sDifficulty === "hard") ? 0.5 : 0.0;
        
        // Calculate total multiplier
        _fCurrentMultiplier = baseMultiplier + jumpBonus + difficultyBonus;
        
        // Apply maximum limit based on bet amount to prevent excessive winnings
        var maxMultiplier = 100 / _fBetAmount; // Ensure max 100 MON winnings
        _fCurrentMultiplier = Math.min(_fCurrentMultiplier, maxMultiplier);
        
        console.log("Multiplier calculation - Jumps:", _iSuccessfulJumps, "Difficulty:", _sDifficulty, "Bet:", _fBetAmount, "Final multiplier:", _fCurrentMultiplier.toFixed(2));
        
        return _fCurrentMultiplier;
    };
    
    // Cashout function
    // Cashout function
    this.cashout = function() {
        try {
            console.log("Cashout button clicked!");
            
            // Log cashout attempt
            if (window.errorLogger) {
                window.errorLogger.info('Cashout attempted', {
                    betAmount: _fBetAmount,
                    currentMultiplier: _fCurrentMultiplier,
                    successfulJumps: _iSuccessfulJumps,
                    difficulty: _sDifficulty,
                    gameStarted: _bGameStarted,
                    cashoutInProgress: _bCashoutInProgress
                });
            }
            
            // ÇOKLU TIKLAMA ENGELLEMESİ
            if (_bCashoutInProgress) {
                console.log("Cashout already in progress - ignoring click");
                if (window.errorLogger) {
                    window.errorLogger.warn('Cashout blocked - already in progress');
                }
                return;
            }
        
            console.log("Cashout internal check - _bGameStarted:", _bGameStarted, "_bGameOver:", _bGameOver);
            
            if (!_bGameStarted || _bGameOver) {
                console.log("Cannot cashout - game not active");
                if (window.errorLogger) {
                    window.errorLogger.warn('Cashout blocked - game not active', {
                        gameStarted: _bGameStarted,
                        gameOver: _bGameOver
                    });
                }
                return;
            }
            
            // Cashout işlemini başlat
            _bCashoutInProgress = true;
            
            // HEMEN OYUN DURUMUNU DURDUR - Asenkron işlemleri engelle
            _bGameStarted = false;
            
            var winnings = Math.min(_fBetAmount * _fCurrentMultiplier, 100); // Max 100 MON
            
            console.log("Cashed out! Winnings:", winnings.toFixed(2), "MON");
            
            // Log successful cashout
            if (window.errorLogger) {
                window.errorLogger.info('Cashout successful', {
                    winnings: winnings,
                    betAmount: _fBetAmount,
                    multiplier: _fCurrentMultiplier,
                    successfulJumps: _iSuccessfulJumps
                });
            }
        
        // Hide game UI immediately
        // Hide game UI immediately
        _oInterface.hideGameUI();
        
        // Reset character and platforms to starting positions (bu tüm game state'leri de resetler)
        this.resetGameElements();
        // Shark attack animasyonunu durdur (cashout'ta)
        this.stopSharkAttack();
        
        // Save to JSON database
        this._saveGameResultToJSON({
            playerName: "Player" + Math.floor(Math.random() * 1000), // Random player name for now
            betAmount: _fBetAmount,
            difficulty: _sDifficulty,
            multiplier: _fCurrentMultiplier,
            winnings: winnings,
            successfulJumps: _iSuccessfulJumps,
            gameTime: Math.floor((new Date().getTime() - _iGameStartTime) / 1000), // Game duration in seconds
            isWin: true
        });
        
        // Cüzdan entegrasyonu - kazanç işle
        if (window.walletManager) {
            window.walletManager.processWin(winnings);
        }
        
        // Achievement checking removed
        
        // Show beautiful cashout notification
        showCashoutNotification(winnings, false); // false = manuel cashout
        
        // Show gambling UI again after shorter delay
        // Show gambling UI again after shorter delay
        var self = this;
        setTimeout(function() {
            console.log("Showing betting UI after cashout...");
            console.log("Interface reference:", _oInterface);
            console.log("showBettingUI function:", _oInterface ? _oInterface.showBettingUI : "undefined");
            if (_oInterface && _oInterface.showBettingUI) {
                _oInterface.showBettingUI(_fBetAmount, _iCurrentLevel);
                // Wallet'ı tekrar göster
                if (_oInterface.showWallet) {
                    _oInterface.showWallet();
                    console.log("👁️ Wallet shown after cashout");
                }
            } else {
                console.error("Interface or showBettingUI function not available");
            }
            
            // Cashout işlemi tamamlandı
            _bCashoutInProgress = false;
        }, 3500); // 3.5 seconds delay (notification + 0.5s buffer)
        
        } catch (error) {
            if (window.errorLogger) {
                window.errorLogger.error('Cashout failed', {
                    error: error.message,
                    stack: error.stack,
                    betAmount: _fBetAmount,
                    currentMultiplier: _fCurrentMultiplier,
                    successfulJumps: _iSuccessfulJumps
                });
            }
            
            // Show user-friendly error
            if (window.errorLogger) {
                window.errorLogger.showErrorToUser('Cashout işlemi başarısız oldu. Lütfen tekrar deneyin.');
            }
            
            // Reset cashout state
            _bCashoutInProgress = false;
        }
    };
    
    // Cashout function with specific multiplier (for congratulations popup)
    this.cashoutWithMultiplier = function(specificMultiplier) {
        if (!_bGameStarted) return;
        
        // HEMEN OYUN DURUMUNU DURDUR - Asenkron işlemleri engelle
        _bGameStarted = false;
        
        var winnings = Math.min(_fBetAmount * specificMultiplier, 100); // Max 100 MON
        
        console.log("Cashed out with specific multiplier! Multiplier:", specificMultiplier.toFixed(2), "Winnings:", winnings.toFixed(2), "MON");
        
        // Hide game UI immediately
        _oInterface.hideGameUI();
        
        // Reset character and platforms to starting positions (bu tüm game state'leri de resetler)
        this.resetGameElements();
        
        // Shark attack animasyonunu durdur (cashout'ta)
        this.stopSharkAttack();
        
        // Save to JSON database with specific multiplier
        this._saveGameResultToJSON({
            playerName: "Player" + Math.floor(Math.random() * 1000), // Random player name for now
            betAmount: _fBetAmount,
            difficulty: _sDifficulty,
            multiplier: specificMultiplier, // Use specific multiplier instead of current
            winnings: winnings,
            successfulJumps: _iSuccessfulJumps,
            gameTime: Math.floor((new Date().getTime() - _iGameStartTime) / 1000), // Game duration in seconds
            isWin: true
        });
        
        // Show beautiful cashout notification
        showCashoutNotification(winnings, false); // false = manuel cashout
        
        // PROFIT UPDATE - WalletManager'a kazancı ekle
        if (window.walletManager && window.walletManager.processWin) {
            console.log("🎉 Adding celebration platform winnings to profit:", winnings.toFixed(4), "MON");
            window.walletManager.processWin(winnings);
        } else {
            console.error("❌ WalletManager not available for profit update");
        }
        
        // Show gambling UI again after shorter delay
        var self = this;
        setTimeout(function() {
            console.log("Showing betting UI after cashout...");
            console.log("Interface reference:", _oInterface);
            console.log("showBettingUI function:", _oInterface ? _oInterface.showBettingUI : "undefined");
            if (_oInterface && _oInterface.showBettingUI) {
                _oInterface.showBettingUI(_fBetAmount, _iCurrentLevel);
                // Wallet'ı tekrar göster
                if (_oInterface.showWallet) {
                    _oInterface.showWallet();
                    console.log("👁️ Wallet shown after cashout");
                }
            } else {
                console.error("Interface or showBettingUI function not available");
            }
        }, 3500); // 3.5 seconds delay (notification + 0.5s buffer)
    };
    
    
    this.releaseScreen = function () {
        // Mouse release - artık uzun basma gerektirmez
        _bTapping = false;
        _iTappingTime = 0;
    };
    
    this.tapScreen = function () {
        // If betting UI is showing, don't allow jumping
        if (_bShowingBetUI) {
            console.log("JUMP BLOCKED - Betting UI is showing!");
            return;
        }
        
        // If game is not started, don't allow jumping
        if (!_bGameStarted) {
            console.log("JUMP BLOCKED - Game not started!");
            return;
        }
        
        // If game over screen is showing, don't allow jumping
        if (_bGameOver) {
            console.log("JUMP BLOCKED - Game over screen is active!");
            return;
        }
        
        // COOLDOWN SİSTEMİ - CCharacter.js'deki zıplama durumunu kontrol et
        // 8. zıplama (kutlama platformuna) için özel kontrol - _iJumpsLeft 0 olsa bile izin ver
        // 8. zıplama kontrolü: _iSuccessfulJumps 7 ise (7. platformdayız) kutlama platformuna zıplamaya izin ver
        var canJump8th = (_iSuccessfulJumps === 7 && _iJumpsLeft === 0);
        
        if(_bJumping || (_iJumpsLeft < 0 && !canJump8th) || !_oCharacterManager.onGround()){
            console.log("JUMP BLOCKED - Game level block! Jumping:", _bJumping, "JumpsLeft:", _iJumpsLeft, "OnGround:", _oCharacterManager.onGround(), "CanJump8th:", canJump8th, "SuccessfulJumps:", _iSuccessfulJumps);
            return;
        }
        
        // 8. zıplama için özel log
        if (canJump8th) {
            console.log("🎉 ALLOWING 8TH JUMP TO CELEBRATION PLATFORM! SuccessfulJumps:", _iSuccessfulJumps, "JumpsLeft:", _iJumpsLeft);
        }
        
        // RİSK KONTROLÜ KALDIRILDI - PLATFORMA İNİŞTE YAPILACAK
        // Risk kontrolü artık CCharacter.js'de platforma iniş anında yapılacak
        
        // Normal jumping logic
        _bJumping = true;
        _iJumpsLeft--;
        // _iSuccessfulJumps artırımını kaldır - CCharacter.js'de platforma iniş anında artırılacak
        // _iSuccessfulJumps++;
        
        _oCharacterManager.updateGraphics(0);
        _oCharacterManager.setCharge(false);
        _oCharacterManager.jump(JUMP_POWER);
        
        if (!_oCharacterManager.isColliding()) {
            _oObstacleManager.setMoltiplier(JUMP_POWER);
        } else {
            _oObstacleManager.setMoltiplier(0);
        }
        
        console.log("Jump started! Jumps:", _iSuccessfulJumps, "Bet:", _fBetAmount);
        
        // DÜZELTME: UI güncelleme kaldırıldı - karakter platforma indiğinde güncellenecek
        // UI güncelleme artık CCharacter.js'deki jump fonksiyonunda, karakter platforma indiğinde yapılacak
    };
    
    // Yeni fonksiyon: Karakter platforma indiğinde UI'ı güncelle - platform indexi ile
    this.updateUIAfterLanding = function(platformIndex, isCelebrationPlatform) {
        // Platform index kontrolü (0-7 arasında olmalı - 8 platform var)
        if (platformIndex < 0 || platformIndex > 7) {
            console.error("Invalid platform index:", platformIndex, "Expected 0-7");
            return;
        }
        
        // Kutlama platformu kontrolü (index 7) - ÖZEL KAZANÇ HESAPLAMASI
        if (platformIndex === 7 || isCelebrationPlatform) {
            console.log("🎉 Celebration platform reached - calculating special winnings!");
            
            // Kutlama platformu için özel multiplier - 7. platformun multiplier'ını kullan
            const multiplierConfig = window.gameConfig ? window.gameConfig.getMultipliers() : {
                easy: [1.28, 1.71, 2.28, 3.04, 4.05, 5.39, 7.19],
                hard: [1.60, 2.67, 4.44, 7.41, 12.35, 20.58, 34.30]
            };
            
            var easyMultipliers = multiplierConfig.easy;
            var celebrationMultiplier = easyMultipliers[6]; // 7. platformun multiplier'ı (index 6)
            
            console.log("🎉 Celebration platform multiplier:", celebrationMultiplier, "Difficulty:", _sDifficulty);
            _fCurrentMultiplier = celebrationMultiplier;
            
            // Apply maximum limit based on bet amount to prevent excessive winnings
            var maxMultiplier = 100 / _fBetAmount; // Ensure max 100 MON winnings
            _fCurrentMultiplier = Math.min(_fCurrentMultiplier, maxMultiplier);
            
            _fCurrentWinnings = Math.min(_fBetAmount * _fCurrentMultiplier, 100); // Cap at 100 MON
            
            console.log("🎉 Celebration platform winnings calculated:", _fCurrentWinnings.toFixed(4), "MON");
            return;
        }
        
        // Get multiplier values from configuration
        const multiplierConfig = window.gameConfig ? window.gameConfig.getMultipliers() : {
            easy: [1.28, 1.71, 2.28, 3.04, 4.05, 5.39, 7.19],
            hard: [1.60, 2.67, 4.44, 7.41, 12.35, 20.58, 34.30]
        };
        
        var easyMultipliers = multiplierConfig.easy; // Index 0 = 1. platform
        var hardMultipliers = multiplierConfig.hard; // Index 0 = 1. platform
        
        // Platform indexine göre multiplier seç - HER ZAMAN EASY MULTIPLIER'LARI KULLAN
        // platformIndex 0 = 1. platform (firstplatform'dan sonraki ilk platform)
        var platformMultiplier = easyMultipliers[platformIndex]; // Her zaman easy multiplier'ları kullan
        
        console.log("Platform", platformIndex + 1, "multiplier set to:", platformMultiplier, "Difficulty:", _sDifficulty);
        _fCurrentMultiplier = platformMultiplier;
        
        // Apply maximum limit based on bet amount to prevent excessive winnings
        var maxMultiplier = 100 / _fBetAmount; // Ensure max 100 MON winnings
        _fCurrentMultiplier = Math.min(_fCurrentMultiplier, maxMultiplier);
        
        _fCurrentWinnings = Math.min(_fBetAmount * _fCurrentMultiplier, 100); // Cap at 100 MON
        
        // Update game UI with current stats
        if (_oInterface && _oInterface.updateGameUI) {
            _oInterface.updateGameUI(_fCurrentMultiplier, _fCurrentWinnings, _iSuccessfulJumps);
        }
        
        console.log("UI updated after landing! Platform:", platformIndex, "Bet:", _fBetAmount, "Platform Multiplier:", platformMultiplier.toFixed(2), "Final Multiplier:", _fCurrentMultiplier.toFixed(2), "Winnings:", _fCurrentWinnings.toFixed(2));
    };
    
    // Calculate jump risk based on difficulty - Configuration-based risk system
    this.calculateJumpRisk = function(platformIndex) {
        if (!_bGameStarted) return 0;
        
        // Get risk values from configuration
        const riskConfig = window.gameConfig ? window.gameConfig.getRisk() : { easy: 0.25, hard: 0.40 };
        
        if (_sDifficulty === "easy") {
            return riskConfig.easy; // %25 risk - Easy mode (configurable)
        } else if (_sDifficulty === "hard") {
            return riskConfig.hard; // %40 risk - Hard mode (configurable)
        }
        
        return 0;
    };
    
    // Reset game elements to starting positions
    // Reset game elements to starting positions - KAPSAMLI HARD RESET
    this.resetGameElements = function() {
        console.log("🔄 COMPREHENSIVE HARD RESET STARTING...");
        
        // 1. ÖNCE TÜM GAME STATE'LERİ SIFIRLA
        _bGameStarted = false;
        _bShowingBetUI = true;
        _bGameOver = false;
        _bJumping = false;
        _bTapping = false;
        _iSuccessfulJumps = 0;
        _fCurrentMultiplier = 1.0;
        _fCurrentWinnings = 0;
        _iJumpsLeft = MAX_JUMPS;
        _iTappingTime = 0;
        _bCollision = false;
        _oCollision = null;
        _bUpdateObst = true;
        _bCashoutInProgress = false; // Cashout flag'ini de resetle
        
        console.log("✅ Game state variables reset");
        
        // 2. CHARACTER RESET - TÜM TWEEN'LERİ DURDUR
        if (_oCharacterManager) {
            // Önce tüm character tween'lerini durdur
            var characterSprite = _oCharacterManager.getSprite();
            if (characterSprite) {
                createjs.Tween.removeTweens(characterSprite);
                // Character'i görünür yap (shark attack'tan sonra gizli kalabilir)
                characterSprite.alpha = 1.0;
            }
            
            // Toz efektlerini temizle
            _oCharacterManager.clearAllDustEffects();
            
            // Character pozisyonunu resetle - DÜZELTME: Basit ve doğru parametreler
            _oCharacterManager.resetPosition(130, 216); // X: 130, Y: 216 (DOĞRU BAŞLANGIÇ POZİSYONU)
            
            // Character reset fonksiyonunu da çağır
            if (_oCharacterManager.reset) {
                _oCharacterManager.reset();
            }
        }
        
        console.log("✅ Character reset complete");
        
        // 3. PLATFORM RESET - TÜM TWEEN'LERİ DURDUR
        if (_oObstacleManager) {
            // Önce tüm platform tween'lerini durdur
            var platforms = _oObstacleManager.getArray();
            for (var i = 0; i < platforms.length; i++) {
                if (platforms[i]) {
                    createjs.Tween.removeTweens(platforms[i]);
                }
            }
            
            // Platform pozisyonlarını resetle
            _oObstacleManager.reset();
            
            // Platform animasyonlarını resetle
            platforms = _oObstacleManager.getArray(); // Yeniden al (reset sonrası)
            for (var i = 0; i < platforms.length; i++) {
                if (platforms[i] && platforms[i].gotoAndStop) {
                    platforms[i].gotoAndStop("idle");
                }
            }
        }
        
        console.log("✅ Platforms reset complete");
        
        // 4. FIRST PLATFORM RESET
        if (_oStartingPlatform) {
            createjs.Tween.removeTweens(_oStartingPlatform);
            _oStartingPlatform.x = STARTX;
            _oStartingPlatform.y = FIRST_PLATFORM_Y;
        }
        
        console.log("✅ First platform reset complete");
        
        // 5. RIVER ANIMATION RESET - YENİ!
        if (_oRiverAnimation && _oRiverAnimation.reset) {
            _oRiverAnimation.reset();
        }
        
        console.log("✅ River animation reset complete");
        
        // 6. SHARK ANIMATION RESET - YENİ!
        if (_oSharkAnimation && _oSharkAnimation.reset) {
            _oSharkAnimation.reset();
        }
        
        console.log("✅ Shark animation reset complete");
        
        // 7. SHARK ATTACK ANIMATION RESET - YENİ!
        if (_oSharkAttackAnimation && _oSharkAttackAnimation.reset) {
            _oSharkAttackAnimation.reset();
        }
        
        console.log("✅ Shark attack animation reset complete");
        
        // 8. Z ORDER SETUP
        this.setupZOrder();
        
        console.log("✅ Z-order setup complete");
        
        // 9. TÜM STAGE TWEEN'LERİNİ DURDUR (güvenlik için)
        createjs.Tween.removeAllTweens();
        
        console.log("✅ All stage tweens removed");
        
        console.log("🎯 COMPREHENSIVE HARD RESET COMPLETE - All systems restored to initial state");
        console.log("   ✅ Character, Platforms, River, Shark, Shark Attack - ALL RESET!");
    };
    this.setUpdObst = function (_bSet){
      _bUpdateObst = _bSet;
    };
    
    this.update = function () {
        if (_bUpdate === false) {
            return;
        }

        if (_bTapping){
            _iTappingTime += 1;
            _oCharacterManager.updateGraphics(_iTappingTime);
        }
        
        _oCharacterManager.update();
        if(!_oCharacterManager.onGround() && _bUpdateObst)
        {
            _oObstacleManager.update();
        }
        
        // Nehir animasyonunu güncelle
        if (_oRiverAnimation) {
            _oRiverAnimation.update();
        }
        
        // Shark animasyonunu güncelle
        if (_oSharkAnimation) {
            _oSharkAnimation.update();
        }
        
        // Shark attack animasyonunu güncelle
        if (_oSharkAttackAnimation) {
            _oSharkAttackAnimation.update();
        }
        
        // CCharacter.js'deki zıplama durumu ile senkronize et
        _bJumping = !_oCharacterManager.onGround();
    };
    
    // Congratulations popup göster
    this.showCongratulationsPopup = function() {
        console.log("🎉 Showing congratulations popup!");
        
        // 7. platformun multiplier değerini hesapla (platform index 6)
        var platform7Multiplier;
        if (_sDifficulty === "hard") {
            platform7Multiplier = 34.30; // Hard mode 7. platform multiplier
        } else {
            platform7Multiplier = 7.19;  // Easy mode 7. platform multiplier
        }
        
        // Maksimum limit uygula (100 MON kazanç limiti)
        var maxMultiplier = 100 / _fBetAmount;
        var finalMultiplier = Math.min(platform7Multiplier, maxMultiplier);
        
        console.log("🎉 Congratulations popup - Platform 7 multiplier:", platform7Multiplier, "Final multiplier:", finalMultiplier, "Difficulty:", _sDifficulty, "Bet:", _fBetAmount);
        
        // Popup arka planı
        var popupBg = new createjs.Shape();
        popupBg.graphics.beginFill("rgba(0, 0, 0, 0.8)").drawRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        popupBg.x = 0;
        popupBg.y = 0;
        popupBg.name = "congratulationsPopup";
        
        // Ana popup kutusu
        var popupBox = new createjs.Shape();
        popupBox.graphics.beginFill("#1a0b3d").drawRoundRect(0, 0, 400, 300, 20);
        popupBox.graphics.beginStroke("#FFD700").setStrokeStyle(4).drawRoundRect(0, 0, 400, 300, 20);
        popupBox.x = (CANVAS_WIDTH - 400) / 2;
        popupBox.y = (CANVAS_HEIGHT - 300) / 2;
        
        // Congratulations text
        var congratsText = new createjs.Text("🎉 CONGRATULATIONS! 🎉", "bold 28px " + PRIMARY_FONT, "#FFD700");
        congratsText.textAlign = "center";
        congratsText.textBaseline = "middle";
        congratsText.x = popupBox.x + 200;
        congratsText.y = popupBox.y + 80;
        congratsText.shadow = new createjs.Shadow("#000000", 3, 3, 6);
        
        // Success message
        var successText = new createjs.Text("You reached the final platform!", "bold 18px " + PRIMARY_FONT, "#FFFFFF");
        successText.textAlign = "center";
        successText.textBaseline = "middle";
        successText.x = popupBox.x + 200;
        successText.y = popupBox.y + 130;
        successText.shadow = new createjs.Shadow("#000000", 2, 2, 4);
        
        // Final multiplier text - 7. platformun multiplier değeri
        var multiplierText = new createjs.Text("Final Multiplier: " + finalMultiplier.toFixed(2) + "x", "bold 16px " + PRIMARY_FONT, "#FFA500");
        multiplierText.textAlign = "center";
        multiplierText.textBaseline = "middle";
        multiplierText.x = popupBox.x + 200;
        multiplierText.y = popupBox.y + 160;
        multiplierText.shadow = new createjs.Shadow("#000000", 2, 2, 4);
        
        // Cashout button
        var cashoutBtn = new createjs.Shape();
        cashoutBtn.graphics.beginFill("#FFD700").drawRoundRect(0, 0, 200, 50, 10);
        cashoutBtn.graphics.beginStroke("#FF8C00").setStrokeStyle(3).drawRoundRect(0, 0, 200, 50, 10);
        cashoutBtn.x = popupBox.x + 100;
        cashoutBtn.y = popupBox.y + 200;
        cashoutBtn.cursor = "pointer";
        
        var cashoutText = new createjs.Text("CASHOUT", "bold 20px " + PRIMARY_FONT, "#000000");
        cashoutText.textAlign = "center";
        cashoutText.textBaseline = "middle";
        cashoutText.x = cashoutBtn.x + 100;
        cashoutText.y = cashoutBtn.y + 25;
        
        // Cashout button click event
        cashoutBtn.on("click", function() {
            console.log("🎉 Cashout button clicked from congratulations popup!");
            var finalWinnings = s_oGame.getBetAmount() * finalMultiplier; // 7. platformun multiplier değerini kullan
            console.log("Final winnings:", finalWinnings.toFixed(2), "MON");
            
            // Cashout işlemi - 7. platformun multiplier değeri ile
            s_oGame.cashoutWithMultiplier(finalMultiplier);
            
            // Popup'ı kaldır
            s_oStage.removeChild(popupBg);
            s_oStage.removeChild(popupBox);
            s_oStage.removeChild(congratsText);
            s_oStage.removeChild(successText);
            s_oStage.removeChild(multiplierText);
            s_oStage.removeChild(cashoutBtn);
            s_oStage.removeChild(cashoutText);
            
            console.log("🎉 Congratulations popup closed, returning to bet UI");
        });
        
        // Hover efekti
        cashoutBtn.on("mouseover", function() {
            cashoutBtn.graphics.clear();
            cashoutBtn.graphics.beginFill("#FFA500").drawRoundRect(0, 0, 200, 50, 10);
            cashoutBtn.graphics.beginStroke("#FF8C00").setStrokeStyle(3).drawRoundRect(0, 0, 200, 50, 10);
        });
        
        cashoutBtn.on("mouseout", function() {
            cashoutBtn.graphics.clear();
            cashoutBtn.graphics.beginFill("#FFD700").drawRoundRect(0, 0, 200, 50, 10);
            cashoutBtn.graphics.beginStroke("#FF8C00").setStrokeStyle(3).drawRoundRect(0, 0, 200, 50, 10);
        });
        
        // Popup animasyonu
        popupBg.alpha = 0;
        popupBox.scaleX = popupBox.scaleY = 0.5;
        popupBox.alpha = 0;
        
        createjs.Tween.get(popupBg).to({alpha: 1}, 300);
        createjs.Tween.get(popupBox).to({scaleX: 1, scaleY: 1, alpha: 1}, 300, createjs.Ease.backOut);
        
        // Stage'e ekle
        s_oStage.addChild(popupBg);
        s_oStage.addChild(popupBox);
        s_oStage.addChild(congratsText);
        s_oStage.addChild(successText);
        s_oStage.addChild(multiplierText);
        s_oStage.addChild(cashoutBtn);
        s_oStage.addChild(cashoutText);
    };
    
    // Oyun durumu kontrolü için getter fonksiyonu
    this.isGameStarted = function() {
        return _bGameStarted;
    };
    
    // Oyun bitti mi kontrolü için getter fonksiyonu
    this.isGameOver = function() {
        return _bGameOver;
    };
    
    // Başarılı zıplama sayısını artır (public fonksiyon)
    this.incrementSuccessfulJumps = function() {
        _iSuccessfulJumps++;
        console.log("Successful jumps incremented to:", _iSuccessfulJumps);
    };
    
    // Başarılı zıplama sayısını al (getter)
    this.getSuccessfulJumps = function() {
        return _iSuccessfulJumps;
    };

    s_oGame = this;
    this._init();
}
function showCashoutNotification(winnings) {
    console.log("Showing cashout notification:", winnings, "MON");
    
    // Prevent multiple notifications
    if (window._bNotificationShowing) {
        console.log("Notification already showing, skipping...");
        return;
    }
    window._bNotificationShowing = true;
    
    // Create notification background (gambling theme - purple gradient)
    var notificationBg = new createjs.Shape();
    notificationBg.graphics.beginLinearGradientFill(
        ["#4A0E4E", "#2D1B69", "#1A0B3D"], 
        [0, 0.5, 1], 
        0, 0, 0, 400
    ).drawRoundRect(0, 0, 500, 300, 20);
    notificationBg.x = (CANVAS_WIDTH - 500) / 2;
    notificationBg.y = (CANVAS_HEIGHT - 300) / 2;
    notificationBg.alpha = 0;
    
    // Add golden border
    var notificationBorder = new createjs.Shape();
    notificationBorder.graphics.beginStroke("#FFD700").setStrokeStyle(4).drawRoundRect(0, 0, 500, 300, 20);
    notificationBorder.x = (CANVAS_WIDTH - 500) / 2;
    notificationBorder.y = (CANVAS_HEIGHT - 300) / 2;
    notificationBorder.alpha = 0;
    
    // Title text
    var titleText = "💰 CASHOUT SUCCESS! 💰";
    var oTitleText = new createjs.Text(titleText, "bold 32px " + PRIMARY_FONT, "#FFD700");
    oTitleText.textAlign = "center";
    oTitleText.textBaseline = "middle";
    oTitleText.x = CANVAS_WIDTH / 2;
    oTitleText.y = (CANVAS_HEIGHT / 2) - 80;
    oTitleText.alpha = 0;
    oTitleText.shadow = new createjs.Shadow("#000000", 3, 3, 5);
    
    // Winnings amount text
    var oWinningsText = new createjs.Text(winnings.toFixed(2) + " MON", "bold 48px " + PRIMARY_FONT, "#00FF00");
    oWinningsText.textAlign = "center";
    oWinningsText.textBaseline = "middle";
    oWinningsText.x = CANVAS_WIDTH / 2;
    oWinningsText.y = CANVAS_HEIGHT / 2;
    oWinningsText.alpha = 0;
    oWinningsText.shadow = new createjs.Shadow("#000000", 4, 4, 8);
    
    // Success message
    var successMsg = "Well played!";
    var oSuccessText = new createjs.Text(successMsg, "bold 24px " + PRIMARY_FONT, "#FFFFFF");
    oSuccessText.textAlign = "center";
    oSuccessText.textBaseline = "middle";
    oSuccessText.x = CANVAS_WIDTH / 2;
    oSuccessText.y = (CANVAS_HEIGHT / 2) + 60;
    oSuccessText.alpha = 0;
    oSuccessText.shadow = new createjs.Shadow("#000000", 2, 2, 4);
    
    // Add elements to stage
    s_oStage.addChild(notificationBg);
    s_oStage.addChild(notificationBorder);
    s_oStage.addChild(oTitleText);
    s_oStage.addChild(oWinningsText);
    s_oStage.addChild(oSuccessText);
    
    // Animate notification appearance
    createjs.Tween.get(notificationBg)
        .to({alpha: 0.95, scaleX: 1.1, scaleY: 1.1}, 300, createjs.Ease.backOut)
        .to({scaleX: 1, scaleY: 1}, 200, createjs.Ease.elasticOut);
        
    createjs.Tween.get(notificationBorder)
        .to({alpha: 1, scaleX: 1.1, scaleY: 1.1}, 300, createjs.Ease.backOut)
        .to({scaleX: 1, scaleY: 1}, 200, createjs.Ease.elasticOut);
    
    createjs.Tween.get(oTitleText)
        .wait(200)
        .to({alpha: 1, y: oTitleText.y - 10}, 400, createjs.Ease.bounceOut);
    
    createjs.Tween.get(oWinningsText)
        .wait(400)
        .to({alpha: 1, scaleX: 1.2, scaleY: 1.2}, 300, createjs.Ease.backOut)
        .to({scaleX: 1, scaleY: 1}, 200, createjs.Ease.elasticOut);
    
    createjs.Tween.get(oSuccessText)
        .wait(600)
        .to({alpha: 1}, 300, createjs.Ease.quadOut);
    
    // Auto-remove notification after 2.5 seconds
    setTimeout(function() {
        // Fade out animation
        createjs.Tween.get(notificationBg).to({alpha: 0, scaleX: 0.8, scaleY: 0.8}, 400, createjs.Ease.backIn);
        createjs.Tween.get(notificationBorder).to({alpha: 0, scaleX: 0.8, scaleY: 0.8}, 400, createjs.Ease.backIn);
        createjs.Tween.get(oTitleText).to({alpha: 0, y: oTitleText.y - 20}, 400, createjs.Ease.backIn);
        createjs.Tween.get(oWinningsText).to({alpha: 0, scaleX: 0.5, scaleY: 0.5}, 400, createjs.Ease.backIn);
        createjs.Tween.get(oSuccessText).to({alpha: 0}, 400, createjs.Ease.backIn);
        
        // Remove from stage after animation
        setTimeout(function() {
            s_oStage.removeChild(notificationBg);
            s_oStage.removeChild(notificationBorder);
            s_oStage.removeChild(oTitleText);
            s_oStage.removeChild(oWinningsText);
            s_oStage.removeChild(oSuccessText);
            window._bNotificationShowing = false; // Reset notification flag
        }, 500);
    }, 2500);
    
    // Play success sound - safe check
    try {
        if (typeof playSound === "function") {
            playSound("win", 1, false);
        }
    } catch (e) {
        console.log("Sound play failed:", e);
    }
}

var s_oGame;
