function CInterface(iBestScore) {
    var _oAudioToggle;
    var _bWalletVisible = true; // Wallet panel görünürlük durumu
    
    // Wallet toggle handler'ları için referanslar
    var _walletToggleHandler = null;
    
    var _pStartPosAudio;
    var _pStartPosRestart;
    var _pStartPosFullscreen;
    var _oScoreText;
    var _iBestScore;
    var _oBestScoreText;
    var _oButFullscreen;
    var _fRequestFullScreen = null;
    var _fCancelFullScreen = null;
    var _oHitArea;
    var _oEndPanel;
    var _oHandPanel;
    var _oScoreOutline;
    var _oBestScoreOutline;
    var _oJumpsLeftText; // Kalan atlama sayısı text'i
    var _oJumpsLeftOutline; // Kalan atlama sayısı outline'ı
    
    // Betting UI elements
    var _oBettingPanel;
    var _oBetAmountText;
    var _oBetAmountOutline;
    var _oWinningsText;
    var _oWinningsOutline;
    var _oBetMinusButton;
    var _oBetPlusButton;
    var _oStartGameButton;
    var _bBettingUIVisible = false;
    var _sCurrentDifficulty = "easy"; // Track current difficulty
    var _oCurrentSelectionText; // Reference to current selection display
    
    this._init = function (iBestScore) {
        _iBestScore = iBestScore;
        // Exit butonu kaldırıldı
        
        // HitArea - oyun alanı için dokunma algılama
        _oHitArea = new createjs.Shape();
        _oHitArea.graphics.beginFill("red").drawRect(0, 10, CANVAS_WIDTH, CANVAS_HEIGHT);
        _oHitArea.alpha = 0.01;
        s_oStage.addChild(_oHitArea);

        _oHitArea.on("mousedown", function () { s_oGame.tapScreen() });
        _oHitArea.on("pressup", function () { s_oGame.releaseScreen() });
        
        if (DISABLE_SOUND_MOBILE === false || s_bMobile === false){
            var oSprite = s_oSpriteLibrary.getSprite('audio_icon');
            
            // Audio buton pozisyonu - sağ üst köşeden 50px sola ve 30px aşağı kaydırıldı
            _pStartPosAudio = {x: CANVAS_WIDTH - 130 - oSprite.width/2, y: 80 + oSprite.height/2}; // 30px aşağı kaydırıldı
            // Audio button positioned 50px left from top right and 30px down
            _oAudioToggle = new CToggle(_pStartPosAudio.x, _pStartPosAudio.y, oSprite, s_bAudioActive, s_oStage);
            _oAudioToggle.addEventListener(ON_MOUSE_UP, this._onAudioToggle, this);
            
            // CToggle sınıfı otomatik olarak doğru hitArea'yı ayarlıyor
            
            // Fullscreen buton pozisyonu - Audio butonundan 80px sol
            _pStartPosFullscreen = {x: _pStartPosAudio.x - 80, y: _pStartPosAudio.y};
            // Fullscreen button positioned 80px left of audio button
        }else{
            // Audio olmadığında fullscreen buton pozisyonu - sağ üst köşe ve 30px aşağı
            _pStartPosFullscreen = {x: CANVAS_WIDTH - 50, y: 80}; // 30px aşağı kaydırıldı
            // Fullscreen button positioned at top right and 30px down
        }

        var doc = window.document;
        var docEl = doc.documentElement;
        _fRequestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
        _fCancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
        
        if(ENABLE_FULLSCREEN === false){
            _fRequestFullScreen = false;
        }
        
        if (_fRequestFullScreen && screenfull.enabled){
            var oSpriteFullscreen = s_oSpriteLibrary.getSprite('but_fullscreen');
            // Fullscreen button pozisyonu
            _oButFullscreen = new CToggle(_pStartPosFullscreen.x, _pStartPosFullscreen.y, oSpriteFullscreen, s_bFullscreen, s_oStage);
            _oButFullscreen.addEventListener(ON_MOUSE_UP, this._onFullscreenRelease, this);
            
            // CToggle sınıfı otomatik olarak doğru hitArea'yı ayarlıyor
            
            _pStartPosRestart = {x: _pStartPosFullscreen.x - oSpriteFullscreen.width, y: _pStartPosFullscreen.y};
        }else{
            _pStartPosRestart = {x: _pStartPosFullscreen.x, y: _pStartPosFullscreen.y};
        }
        // Score, Best Score ve Jumps Left text'leri kaldırıldı

        _oEndPanel = new CEndPanel();
        
        // Help panel kaldırıldı - gambling modunda gerekli değil
        // if(s_bFirstPlay){
        //     s_bFirstPlay = false;
        //     _oHandPanel = new CHelpPanel();
        // }
        
        this.refreshButtonPos(s_iOffsetX, s_iOffsetY);
    };

    this.refreshButtonPos = function (iNewX, iNewY) {
        // Exit button kaldırıldı
        
        // Audio button pozisyonu - 50px sola ve 30px aşağı kaydırıldı
        if (DISABLE_SOUND_MOBILE === false || s_bMobile === false) {
            var oSpriteAudio = s_oSpriteLibrary.getSprite('audio_icon');
            _oAudioToggle.setPosition(CANVAS_WIDTH - 130 - oSpriteAudio.width/2, 80 + oSpriteAudio.height/2); // 30px aşağı kaydırıldı
        }
        
        // Fullscreen button pozisyonu - Audio butonundan 80px sol ve 30px aşağı
        if (_fRequestFullScreen && screenfull.enabled){
            var oSpriteFullscreen = s_oSpriteLibrary.getSprite('but_fullscreen');
            _oButFullscreen.setPosition(CANVAS_WIDTH - 210 - oSpriteFullscreen.width/2, 80 + oSpriteFullscreen.height/2); // 30px aşağı kaydırıldı
        }
    };

   this.refreshScore = function(iScore){
       // Score güncelleme fonksiyonu boş bırakıldı
    };
    
    this.updateJumpsLeft = function(iJumpsLeft){
        // Jumps left güncelleme fonksiyonu boş bırakıldı
    };
    
    // Betting UI functions - Now using HTML elements
    this.showBettingUI = function(iBetAmount, iLevel) {
        console.log("=== showBettingUI called ===");
        console.log("Bet amount:", iBetAmount, "Level:", iLevel);
        console.log("Already visible:", _bBettingUIVisible);
        
        if (_bBettingUIVisible) {
            console.log("Betting UI already visible, returning");
            return;
        }
        
        _bBettingUIVisible = true;
        
        // Show UI container and betting UI
        var uiContainer = document.getElementById('ui-container');
        var bettingUI = document.getElementById('betting-ui');
        var gameUI = document.getElementById('game-ui');
        
        console.log("UI Container element:", uiContainer);
        console.log("Betting UI element:", bettingUI);
        console.log("Game UI element:", gameUI);
        
        // Show UI container
        if (uiContainer) {
            uiContainer.classList.add('game-active');
            console.log("UI container made visible");
        }
        
        if (bettingUI) {
            bettingUI.style.display = 'flex';
            bettingUI.style.visibility = 'visible';
            console.log("Betting UI shown and made visible");
        } else {
            console.error("Betting UI element not found!");
        }
        
        if (gameUI) {
            gameUI.style.display = 'none';
            console.log("Game UI hidden");
        }
        
        // Update bet amount display
        this.updateBetAmount(iBetAmount);
        
        // Update difficulty buttons to show initial state
        this.updateDifficultyButtons();
        
        // Add event listeners
        this._addBettingEventListeners();
        
        // Wallet toggle listener'ını ekle
        this._addWalletToggleListener();
        
        // Wallet toggle butonunu ayarla (başlangıçta wallet görünür)
        this._updateWalletToggleButton();
        
        console.log("=== Betting UI setup complete ===");
    };
    
    this.hideBettingUI = function() {
        if (!_bBettingUIVisible) return;
        
        _bBettingUIVisible = false;
        
        // Hide betting UI
        var bettingUI = document.getElementById('betting-ui');
        if (bettingUI) {
            bettingUI.style.display = 'none';
        }
        
        // Remove event listeners
        this._removeBettingEventListeners();
        
        // Wallet toggle listener'larını da temizle
        this._removeWalletToggleListeners();
        
        console.log("Betting UI hidden");
    };
    
    // Event handler functions - defined as properties so they can be removed
    this._betMinusHandler = function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log("=== BET MINUS CLICKED ===");
        if (s_oGame && s_oGame.decreaseBet) {
            console.log("Calling s_oGame.decreaseBet()");
            s_oGame.decreaseBet();
            s_oInterface.updateCurrentSelection(); // UI'yi güncelle
        } else {
            console.log("s_oGame.decreaseBet not available");
        }
    };
    
    this._betPlusHandler = function(e) {
        e.preventDefault();
        console.log("Bet plus clicked!");
        if (s_oGame && s_oGame.increaseBet) {
            s_oGame.increaseBet();
            s_oInterface.updateCurrentSelection(); // UI'yi güncelle
        }
    };
    
    this._easyModeHandler = function(e) {
        e.preventDefault();
        console.log("Easy mode clicked!");
        _sCurrentDifficulty = "easy";
        s_oGame.setDifficulty("easy");
        s_oInterface.updateDifficultyButtons(); // Buton durumlarını güncelle
        s_oInterface.updateCurrentSelection();
    };
    
    this._hardModeHandler = function(e) {
        e.preventDefault();
        console.log("Hard mode clicked!");
        _sCurrentDifficulty = "hard";
        s_oGame.setDifficulty("hard");
        s_oInterface.updateDifficultyButtons(); // Buton durumlarını güncelle
        s_oInterface.updateCurrentSelection();
    };
    
    this._startGameHandler = function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Prevent multiple clicks
        if (this.disabled) {
            console.log("Start game button already clicked, ignoring...");
            return;
        }
        
        console.log("Start game clicked!");
        
        // WalletManager durumunu kontrol et
        console.log("🔍 WalletManager status:", {
            exists: !!window.walletManager,
            balance: window.walletManager ? window.walletManager.getBalance() : 'N/A',
            connected: window.walletManager ? window.walletManager.isConnected() : 'N/A',
            address: window.walletManager ? window.walletManager.getAddress() : 'N/A'
        });
        
        // Bakiye kontrolü (minimum 1 MON)
        var betAmount = s_oGame ? s_oGame.getBetAmount() : 1.0;
        console.log("🔍 Bet amount:", betAmount);
        
        if (window.walletManager && !window.walletManager.canPlaceBet(betAmount)) {
            console.log("❌ Insufficient balance - cannot start game");
            if (window.errorLogger) {
                window.errorLogger.showErrorToUser('You need at least 1 MON balance to start playing.');
            }
            return;
        }
        
        this.disabled = true; // Disable button temporarily
        
        s_oInterface.hideBettingUI();
        if (s_oGame && s_oGame.startGameplay) {
            s_oGame.startGameplay();
        }
        
        // Re-enable button after a short delay
        setTimeout(function() {
            var startBtn = document.getElementById('start-game');
            if (startBtn) startBtn.disabled = false;
        }, 1000);
    };
    
    this._backMenuHandler = function(e) {
        e.preventDefault();
        console.log("Back menu clicked!");
        s_oInterface.hideBettingUI();
        
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
            if (s_oGame && s_oGame.unload) {
                s_oGame.unload();
            }
            if (s_oMain && s_oMain.gotoMenu) {
                s_oMain.gotoMenu();
            }
        }
    };

    // Add event listeners for HTML betting UI
    this._addBettingEventListeners = function() {
        var self = this;
        
        console.log("=== Adding betting event listeners ===");
        console.log("Current bet amount:", _iBetAmount);
        console.log("Current difficulty:", _sCurrentDifficulty);
        
        // Bet amount controls
        var betMinusBtn = document.getElementById('bet-minus');
        if (betMinusBtn) {
            console.log("Adding click listener to bet-minus button");
            betMinusBtn.addEventListener('click', this._betMinusHandler);
        } else {
            console.error("bet-minus button not found!");
        }
        
        var betPlusBtn = document.getElementById('bet-plus');
        if (betPlusBtn) {
            betPlusBtn.addEventListener('click', this._betPlusHandler);
        }
        
        // Difficulty controls
        var easyModeBtn = document.getElementById('easy-mode');
        if (easyModeBtn) {
            easyModeBtn.addEventListener('click', this._easyModeHandler);
        }
        
        var hardModeBtn = document.getElementById('hard-mode');
        if (hardModeBtn) {
            hardModeBtn.addEventListener('click', this._hardModeHandler);
        }
        
        // Action buttons
        var startGameBtn = document.getElementById('start-game');
        if (startGameBtn) {
            startGameBtn.addEventListener('click', this._startGameHandler);
        }
        
        var backMenuBtn = document.getElementById('back-menu');
        if (backMenuBtn) {
            backMenuBtn.addEventListener('click', this._backMenuHandler);
        }
        
        // Game UI back button
        var backMenuGameBtn = document.getElementById('back-menu-game');
        if (backMenuGameBtn) {
            backMenuGameBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log("Back menu game clicked!");
                self.hideGameUI();
                
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
                    s_oGame.unload();
                    s_oMain.gotoMenu();
                }
            });
        }
        
        // Bet display - sadece gösterim için
        // Input alanı kaldırıldı, sadece +/- butonları kullanılıyor
        
        // Add keyboard support
        this._addBettingKeyboardEvents();
        
        console.log("=== All betting event listeners added successfully! ===");
        console.log("Total buttons found and configured:");
        console.log("- bet-minus:", document.getElementById('bet-minus') ? "✓" : "✗");
        console.log("- bet-plus:", document.getElementById('bet-plus') ? "✓" : "✗");
        console.log("- easy-mode:", document.getElementById('easy-mode') ? "✓" : "✗");
        console.log("- hard-mode:", document.getElementById('hard-mode') ? "✓" : "✗");
        console.log("- start-game:", document.getElementById('start-game') ? "✓" : "✗");
        console.log("- back-menu:", document.getElementById('back-menu') ? "✓" : "✗");
    };
    
    // Remove event listeners
    this._removeBettingEventListeners = function() {
        console.log("=== Removing betting event listeners ===");
        
        // Remove HTML event listeners
        var betMinusBtn = document.getElementById('bet-minus');
        if (betMinusBtn) {
            betMinusBtn.removeEventListener('click', this._betMinusHandler);
        }
        
        var betPlusBtn = document.getElementById('bet-plus');
        if (betPlusBtn) {
            betPlusBtn.removeEventListener('click', this._betPlusHandler);
        }
        
        var easyModeBtn = document.getElementById('easy-mode');
        if (easyModeBtn) {
            easyModeBtn.removeEventListener('click', this._easyModeHandler);
        }
        
        var hardModeBtn = document.getElementById('hard-mode');
        if (hardModeBtn) {
            hardModeBtn.removeEventListener('click', this._hardModeHandler);
        }
        
        var startGameBtn = document.getElementById('start-game');
        if (startGameBtn) {
            startGameBtn.removeEventListener('click', this._startGameHandler);
        }
        
        var backMenuBtn = document.getElementById('back-menu');
        if (backMenuBtn) {
            backMenuBtn.removeEventListener('click', this._backMenuHandler);
        }
        
        // Remove keyboard events
        this._removeBettingKeyboardEvents();
        
        console.log("=== All betting event listeners removed ===");
    };
    
    // Update difficulty button states
    // Update difficulty button states
    this.updateDifficultyButtons = function() {
        var easyBtn = document.getElementById('easy-mode');
        var hardBtn = document.getElementById('hard-mode');
        
        if (easyBtn && hardBtn) {
            // Önce tüm active class'ları kaldır
            easyBtn.classList.remove('active');
            hardBtn.classList.remove('active');
            
            // Sonra seçili olana active class ekle
            if (_sCurrentDifficulty === 'easy') {
                easyBtn.classList.add('active');
                console.log("Easy mode button activated");
            } else if (_sCurrentDifficulty === 'hard') {
                hardBtn.classList.add('active');
                console.log("Hard mode button activated");
            }
        }
    };
    // Add keyboard event listener for betting UI
    this._addBettingKeyboardEvents = function() {
        var self = this;
        
        $(document).on('keydown.betting', function(e) {
            if (!_bBettingUIVisible) return;
            
            // Enter key to start game
            if (e.keyCode === 13) { // Enter key
                s_oGame.startGameplay();
            }
            // E key for Easy mode
            else if (e.keyCode === 69) { // E key
                _sCurrentDifficulty = "easy";
                s_oGame.setDifficulty("easy");
                self.updateCurrentSelection();
            }
            // H key for Hard mode
            else if (e.keyCode === 72) { // H key
                _sCurrentDifficulty = "hard";
                s_oGame.setDifficulty("hard");
                self.updateCurrentSelection();
            }
        });
    };
    
    // Remove keyboard event listener for betting UI
    this._removeBettingKeyboardEvents = function() {
        $(document).off('keydown.betting');
    };
    this.updateWinnings = function(fWinnings) {
        if (_oWinningsText) {
            _oWinningsText.text = "Potential Winnings: " + fWinnings.toFixed(2) + " MON";
            _oWinningsOutline.text = "Potential Winnings: " + fWinnings.toFixed(2) + " MON";
        }
    };
    
    this.updateBetAmount = function(iBetAmount) {
        _iBetAmount = iBetAmount; // Store current bet amount
        var betDisplay = document.getElementById('bet-display');
        if (betDisplay) {
            betDisplay.textContent = iBetAmount.toFixed(1) + " MON";
        }
        
        this.updateCurrentSelection();
    };
    
    // Game UI elements
    var _oGamePanel;
    var _oMultiplierText;
    var _oWinningsDisplayText;
    var _oJumpsText;
    var _oCashoutButton;
    var _bGameUIVisible = false;
    
    // Show game UI during gameplay - Now using HTML elements
    this.showGameUI = function(iBetAmount, sDifficulty, fMultiplier) {
        console.log("showGameUI called with:", iBetAmount, sDifficulty, fMultiplier);
        
        // Ensure UI container is visible
        var uiContainer = document.getElementById('ui-container');
        if (uiContainer) {
            uiContainer.classList.add('game-active');
        }
        
        // Hide betting UI and show game UI
        document.getElementById('betting-ui').style.display = 'none';
        document.getElementById('game-ui').style.display = 'flex';
        
        // Update game info
        document.getElementById('game-bet').textContent = iBetAmount + " MON";
        document.getElementById('game-mode').textContent = sDifficulty.toUpperCase();
        document.getElementById('game-multiplier').textContent = fMultiplier.toFixed(2) + "x";
        document.getElementById('game-winnings').textContent = (iBetAmount * fMultiplier).toFixed(2) + " MON";
        document.getElementById('game-jumps').textContent = "0";
        
        // Add cashout event listener with state management
        var self = this;
        var cashoutBtn = document.getElementById('cashout-btn');
        if (cashoutBtn) {
            // Remove existing listeners to prevent duplicates
            cashoutBtn.removeEventListener('click', self._cashoutHandler);
            
            // Create new handler
            self._cashoutHandler = function(e) {
                e.preventDefault();
                console.log("Cashout button clicked!");
                
                // Check if game is active before allowing cashout
                if (s_oGame && s_oGame.cashout) {
                    // Check game state more thoroughly
                    const isGameStarted = s_oGame.isGameStarted && s_oGame.isGameStarted();
                    const isGameOver = s_oGame.isGameOver && s_oGame.isGameOver();
                    const isGameActive = isGameStarted && !isGameOver;
                    
                    console.log("Cashout check - Game started:", isGameStarted, "Game over:", isGameOver, "Game active:", isGameActive);
                    
                    if (isGameActive) {
                        s_oGame.cashout();
                    } else {
                        // Show user-friendly message
                        if (window.errorLogger) {
                            window.errorLogger.showErrorToUser('Oyun henüz başlamadı veya bitti. Lütfen önce oyunu başlatın.');
                        }
                        console.log("Cashout blocked - game not active. Game started:", isGameStarted, "Game over:", isGameOver);
                    }
                } else {
                    console.log("Cashout blocked - game instance not available");
                }
            };
            
            cashoutBtn.addEventListener('click', self._cashoutHandler);
            
            // Initially disable cashout button
            cashoutBtn.disabled = true;
            cashoutBtn.style.opacity = '0.5';
            cashoutBtn.style.cursor = 'not-allowed';
        }
        
        // Add keyboard support
        this._addGameKeyboardEvents();
        
        _bGameUIVisible = true;
        console.log("Game UI should now be visible with working cashout button");
    };
    // Update game UI during gameplay
    this.updateGameUI = function(fMultiplier, fWinnings, iJumps) {
        if (_bGameUIVisible) {
            document.getElementById('game-multiplier').textContent = fMultiplier.toFixed(2) + "x";
            document.getElementById('game-winnings').textContent = fWinnings.toFixed(2) + " MON";
            document.getElementById('game-jumps').textContent = iJumps;
            
            // Enable cashout button when game is active
            var cashoutBtn = document.getElementById('cashout-btn');
            if (cashoutBtn && s_oGame) {
                const isGameStarted = s_oGame.isGameStarted && s_oGame.isGameStarted();
                const isGameOver = s_oGame.isGameOver && s_oGame.isGameOver();
                
                console.log("updateGameUI - Game started:", isGameStarted, "Game over:", isGameOver);
                
                if (isGameStarted && !isGameOver) {
                    cashoutBtn.disabled = false;
                    cashoutBtn.style.opacity = '1';
                    cashoutBtn.style.cursor = 'pointer';
                    
                    if (window.errorLogger) {
                        window.errorLogger.debug('Cashout button enabled in updateGameUI', {
                            isGameStarted: isGameStarted,
                            isGameOver: isGameOver
                        });
                    }
                } else {
                    // Disable button if game is not active
                    cashoutBtn.disabled = true;
                    cashoutBtn.style.opacity = '0.5';
                    cashoutBtn.style.cursor = 'not-allowed';
                }
            }
        }
    };
    
    // Enable cashout button when game starts
    this.enableCashoutButton = function() {
        var cashoutBtn = document.getElementById('cashout-btn');
        if (cashoutBtn) {
            cashoutBtn.disabled = false;
            cashoutBtn.style.opacity = '1';
            cashoutBtn.style.cursor = 'pointer';
            
            if (window.errorLogger) {
                window.errorLogger.debug('Cashout button enabled');
            }
        }
    };
    
    // Disable cashout button
    this.disableCashoutButton = function() {
        var cashoutBtn = document.getElementById('cashout-btn');
        if (cashoutBtn) {
            cashoutBtn.disabled = true;
            cashoutBtn.style.opacity = '0.5';
            cashoutBtn.style.cursor = 'not-allowed';
            
            if (window.errorLogger) {
                window.errorLogger.debug('Cashout button disabled');
            }
        }
    };
    
    // Hide game UI
    // Hide game UI
    this.hideGameUI = function() {
        if (!_bGameUIVisible) return;
        
        _bGameUIVisible = false;
        
        // Hide game UI
        document.getElementById('game-ui').style.display = 'none';
        
        // Hide UI container when no UI is active
        var uiContainer = document.getElementById('ui-container');
        if (uiContainer && !_bBettingUIVisible) {
            uiContainer.classList.remove('game-active');
        }
        
        // Remove keyboard event listener
        this._removeGameKeyboardEvents();
    };
    // Show cashout result
    this.showCashoutResult = function(fWinnings) {
        this.hideGameUI();
        
        // Cashout result panel
        var oResultPanel = new createjs.Shape();
        oResultPanel.graphics.beginFill("rgba(0,0,0,0.9)").drawRoundRect(CANVAS_WIDTH/2 - 200, CANVAS_HEIGHT/2 - 100, 400, 200, 20);
        s_oStage.addChild(oResultPanel);
        
        var oResultOutline = new createjs.Text("CASHOUT SUCCESSFUL!", "32px " + PRIMARY_FONT, "#000");
        oResultOutline.x = CANVAS_WIDTH/2;
        oResultOutline.y = CANVAS_HEIGHT/2 - 50;
        oResultOutline.textAlign = "center";
        oResultOutline.outline = 3;
        s_oStage.addChild(oResultOutline);
        
        var oResultText = new createjs.Text("CASHOUT SUCCESSFUL!", "32px " + PRIMARY_FONT, "#00FF00");
        oResultText.x = CANVAS_WIDTH/2;
        oResultText.y = CANVAS_HEIGHT/2 - 50;
        oResultText.textAlign = "center";
        s_oStage.addChild(oResultText);
        
        var oWinningsOutline = new createjs.Text("You won: " + fWinnings.toFixed(2) + " MON", "28px " + PRIMARY_FONT, "#000");
        oWinningsOutline.x = CANVAS_WIDTH/2;
        oWinningsOutline.y = CANVAS_HEIGHT/2;
        oWinningsOutline.textAlign = "center";
        oWinningsOutline.outline = 3;
        s_oStage.addChild(oWinningsOutline);
        
        var oWinningsText = new createjs.Text("You won: " + fWinnings.toFixed(2) + " MON", "28px " + PRIMARY_FONT, "#FFD700");
        oWinningsText.x = CANVAS_WIDTH/2;
        oWinningsText.y = CANVAS_HEIGHT/2;
        oWinningsText.textAlign = "center";
        s_oStage.addChild(oWinningsText);
        
        var oRestartText = new createjs.Text("Starting new game...", "20px " + PRIMARY_FONT, "#FFFFFF");
        oRestartText.x = CANVAS_WIDTH/2;
        oRestartText.y = CANVAS_HEIGHT/2 + 50;
        oRestartText.textAlign = "center";
        s_oStage.addChild(oRestartText);
    };
    
    // Game keyboard events
    this._addGameKeyboardEvents = function() {
        var self = this;
        $(document).on('keydown.game', function(e) {
            if (!_bGameUIVisible) return;
            
            // C key for cashout
            if (e.keyCode === 67) { // C key
                s_oGame.cashout();
            }
        });
    };
    
    this._removeGameKeyboardEvents = function() {
        $(document).off('keydown.game');
    };
    
    // Butonları her zaman en üstte tutmak için fonksiyon
    this.bringButtonsToFront = function() {
        try {
            // Exit butonu kaldırıldı
            
            // Audio butonunu en üste taşı
            if (_oAudioToggle && _oAudioToggle._oButton) {
                s_oStage.setChildIndex(_oAudioToggle._oButton, s_oStage.children.length - 1);
            }
            
            // Fullscreen butonunu en üste taşı
            if (_oButFullscreen && _oButFullscreen._oButton) {
                s_oStage.setChildIndex(_oButFullscreen._oButton, s_oStage.children.length - 1);
            }
            
            console.log("Buttons brought to front");
        } catch (e) {
            console.log("Error bringing buttons to front:", e);
        }
    };
    
    this.unload = function () {
        
        if (DISABLE_SOUND_MOBILE === false || s_bMobile === false) {
            _oAudioToggle.unload();
            _oAudioToggle = null;
        }
        
        if (_fRequestFullScreen && screenfull.enabled){
            _oButFullscreen.unload();
        }

        // Exit butonu kaldırıldı
        s_oInterface = null;
    };
    
    
    // Pause/Continue state
    var _bGamePaused = false;
    
    this._onPauseContinue = function ()
    {
        if (_bGamePaused) {
            // Resume game
            console.log("Resuming game...");
            _bGamePaused = false;
            s_oGame.resumeGame();
            // Hide betting UI if visible
            this.hideBettingUI();
        } else {
            // Pause game
            console.log("Pausing game...");
            _bGamePaused = true;
            s_oGame.pauseGame();
            // Show betting UI for new bet
            this.showBettingUI(s_oGame.getCurrentBetAmount(), s_oGame.getCurrentDifficulty());
        }
    };
    
    this._onExit = function ()
    {
        s_oGame.unload();
        s_oMain.gotoMenu();
    };

    this.gameOver = function ()
    {
      _oEndPanel.show();  
    };
    this._onAudioToggle = function () {
        Howler.mute(s_bAudioActive);
        s_bAudioActive = !s_bAudioActive;
    };
    
    this.resetFullscreenBut = function(){
	if (_oButFullscreen){
		_oButFullscreen.setActive(s_bFullscreen);
	}
    };

    this._onFullscreenRelease = function(){
        try {
            if(s_bFullscreen) { 
                _fCancelFullScreen.call(window.document);
                s_bFullscreen = false;
            }else{
                _fRequestFullScreen.call(window.document.documentElement);
                s_bFullscreen = true;
            }
        } catch (error) {
            console.log("Fullscreen error:", error);
        }
	
	sizeHandler();
	};
	
	// Button event handlers for betting UI - REMOVED
	// Artık HTML event listener'ları kullanıyoruz, bu fonksiyonlar gereksiz
	
	this._onEasyMode = function() {
	    _sCurrentDifficulty = "easy";
	    s_oGame.setDifficulty("easy");
	    this.updateCurrentSelection();
	    console.log("Easy mode selected");
	};
	
	this._onHardMode = function() {
	    _sCurrentDifficulty = "hard";
	    s_oGame.setDifficulty("hard");
	    this.updateCurrentSelection();
	    console.log("Hard mode selected");
	};
	
	// Update current selection display
	this.updateCurrentSelection = function() {
	    if (_bBettingUIVisible) {
	        // Bu fonksiyon artık gerekli değil çünkü HTML'de ayrı elementler var
	        console.log("Current selection: " + _iBetAmount + " MON, " + _sCurrentDifficulty.toUpperCase() + " mode");
	    }
	};
	
	this._onStartGame = function() {
	    this.hideBettingUI();
	    s_oGame.startGameplay();
	};
	// Add missing _onBackToMenu function
	this._onBackToMenu = function() {
	    this.hideBettingUI();
	    s_oGame.unload();
	    s_oMain.gotoMenu();
	};
	
    // Wallet Toggle Functions
    this._removeWalletToggleListeners = function() {
        if (_walletToggleHandler) {
            var walletToggleBtn = document.getElementById('wallet-toggle');
            if (walletToggleBtn) {
                walletToggleBtn.removeEventListener('click', _walletToggleHandler);
                console.log("🧹 Betting wallet toggle listener removed");
            }
            
            var walletToggleGameBtn = document.getElementById('wallet-toggle-game');
            if (walletToggleGameBtn) {
                walletToggleGameBtn.removeEventListener('click', _walletToggleHandler);
                console.log("🧹 Game wallet toggle listener removed");
            }
        }
    };
    
    this._addWalletToggleListener = function() {
        // Önce mevcut listener'ları temizle
        this._removeWalletToggleListeners();
        
        // Handler'ı oluştur
        _walletToggleHandler = this._onWalletToggle.bind(this);
        
        var walletToggleBtn = document.getElementById('wallet-toggle');
        if (walletToggleBtn) {
            walletToggleBtn.addEventListener('click', _walletToggleHandler);
            console.log("✅ Wallet toggle listener added");
        } else {
            console.error("❌ Wallet toggle button not found");
        }
        
        // Game UI wallet toggle listener
        var walletToggleGameBtn = document.getElementById('wallet-toggle-game');
        if (walletToggleGameBtn) {
            walletToggleGameBtn.addEventListener('click', _walletToggleHandler);
            console.log("✅ Game wallet toggle listener added");
        } else {
            console.error("❌ Game wallet toggle button not found");
        }
    };
	
	this._onWalletToggle = function(e) {
	    e.preventDefault();
	    e.stopPropagation();
	    
	    console.log("🔄 Wallet toggle clicked, current state:", _bWalletVisible);
	    
	    _bWalletVisible = !_bWalletVisible;
	    this._updateWalletVisibility();
	    this._updateWalletToggleButton();
	    
	    console.log("✅ Wallet visibility toggled to:", _bWalletVisible);
	};
	
	this._updateWalletVisibility = function() {
	    var walletContainer = document.querySelector('.privy-wallet-container');
	    if (walletContainer) {
	        if (_bWalletVisible) {
	            walletContainer.classList.remove('wallet-hidden');
	            walletContainer.classList.add('wallet-visible');
	            console.log("👁️ Wallet panel shown");
	        } else {
	            walletContainer.classList.remove('wallet-visible');
	            walletContainer.classList.add('wallet-hidden');
	            console.log("🙈 Wallet panel hidden");
	        }
	    } else {
	        console.error("❌ Wallet container not found");
	    }
	};
	
    this._updateWalletToggleButton = function() {
        // Update betting UI wallet toggle button
        var walletToggleBtn = document.getElementById('wallet-toggle');
        if (walletToggleBtn) {
            if (_bWalletVisible) {
                walletToggleBtn.textContent = 'HIDE WALLET';
                walletToggleBtn.classList.remove('wallet-hidden');
            } else {
                walletToggleBtn.textContent = 'SHOW WALLET';
                walletToggleBtn.classList.add('wallet-hidden');
            }
            console.log("🔄 Betting wallet toggle button updated:", walletToggleBtn.textContent);
        }
        
        // Update game UI wallet toggle button
        var walletToggleGameBtn = document.getElementById('wallet-toggle-game');
        if (walletToggleGameBtn) {
            if (_bWalletVisible) {
                walletToggleGameBtn.textContent = 'HIDE WALLET';
                walletToggleGameBtn.classList.remove('wallet-hidden');
            } else {
                walletToggleGameBtn.textContent = 'SHOW WALLET';
                walletToggleGameBtn.classList.add('wallet-hidden');
            }
            console.log("🔄 Game wallet toggle button updated:", walletToggleGameBtn.textContent);
        }
    };
	
	// Public method to show wallet (called when game starts)
	this.showWallet = function() {
	    _bWalletVisible = true;
	    this._updateWalletVisibility();
	    this._updateWalletToggleButton();
	};
	
	// Public method to hide wallet (called when game starts)
	this.hideWallet = function() {
	    _bWalletVisible = false;
	    this._updateWalletVisibility();
	    this._updateWalletToggleButton();
	};
	
	// Public method to hide wallet for gameplay (toggle button remains active)
	this.hideWalletForGameplay = function() {
	    _bWalletVisible = false;
	    this._updateWalletVisibility();
	    this._updateWalletToggleButton();
	    console.log("🎮 Wallet hidden for gameplay, toggle buttons remain active");
	};
	
	s_oInterface = this;

	this._init(iBestScore);

	return this;
}

var s_oInterface = null;
var s_bFirstPlay = true;
var s_bFirstPlay = true;