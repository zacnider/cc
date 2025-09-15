/**
 * Global Leaderboard System
 * Enhanced leaderboard with social features, achievements, and weekly challenges
 */
function GlobalLeaderboard() {
    var _oContainer;
    var _oBackground;
    var _aTabs = [];
    var _sCurrentTab = "global";
    var _bIsVisible = false;
    var _oLoadingSpinner;
    var _oContentContainer;
    var _oOnlineIndicator;
    
    // Enhanced tab configurations
    var _aTabConfigs = [
        {
            id: "global",
            title: "🌍 Global",
            icon: "🌍",
            description: "Worldwide rankings"
        },
        {
            id: "achievements",
            title: "🏆 Achievements",
            icon: "🏆",
            description: "Unlock and view achievements"
        },
        {
            id: "weekly",
            title: "📅 Weekly",
            icon: "📅",
            description: "Weekly challenges and rankings"
        },
        {
            id: "social",
            title: "👥 Social",
            icon: "👥",
            description: "Social features and sharing"
        }
    ];
    
    this._init = function() {
        _oContainer = new createjs.Container();
        _oContainer.alpha = 0;
        _oContainer.scaleX = 0.8; // %20 küçültme
        _oContainer.scaleY = 0.8; // %20 küçültme
        _oContainer.x = CANVAS_WIDTH * 0.1; // Ortalama için offset
        _oContainer.y = CANVAS_HEIGHT * 0.1; // Ortalama için offset
        if (typeof s_oStage !== 'undefined' && s_oStage) {
            s_oStage.addChild(_oContainer);
        } else {
            console.error("❌ s_oStage not available for GlobalLeaderboard");
        }
        
        this._createBackground();
        this._createTabs();
        this._createContentArea();
        this._createLoadingSpinner();
        // Online indicator removed from leaderboard
        
        // Load initial data
        this._loadLeaderboardData();
        
        console.log("🏆 Global Leaderboard initialized with social features (scaled to 80%)");
    };
    
    this._createBackground = function() {
        // Main background with gradient
        _oBackground = new createjs.Shape();
        _oBackground.graphics.beginLinearGradientFill(
            ["#1A0B3D", "#2D1B69", "#4A0E4E"], 
            [0, 0.5, 1], 
            0, 0, 0, CANVAS_HEIGHT
        ).drawRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // Make background clickable to close
        _oBackground.addEventListener("click", function() {
            this.hide();
        }.bind(this));
        
        _oContainer.addChild(_oBackground);
        
        // Title with social features
        var titleText = new createjs.Text("🏆 GLOBAL LEADERBOARD", "bold 36px Arial", "#FFD700");
        titleText.textAlign = "center";
        titleText.x = CANVAS_WIDTH / 2;
        titleText.y = 50;
        titleText.shadow = new createjs.Shadow("#000000", 3, 3, 6);
        _oContainer.addChild(titleText);
        
        // Subtitle
        var subtitleText = new createjs.Text("🌟 Social Features • Achievements • Weekly Challenges", "16px Arial", "#CCCCCC");
        subtitleText.textAlign = "center";
        subtitleText.x = CANVAS_WIDTH / 2;
        subtitleText.y = 85;
        _oContainer.addChild(subtitleText);
        
        // Close button using CGfxButton like HowTo panel
        var oSpriteExit = s_oSpriteLibrary.getSprite('but_exit');
        if (oSpriteExit) {
            var _pStartPosExit = {x: CANVAS_WIDTH - 50, y: 50};
            _oButExit = new CGfxButton(_pStartPosExit.x, _pStartPosExit.y, oSpriteExit, _oContainer);
            _oButExit.addEventListener(ON_MOUSE_UP, this.hide, this);
            
            console.log("🚪 Close button using CGfxButton like HowTo panel");
        } else {
            // Fallback to original close button if sprite not found
            var closeBtn = new createjs.Shape();
            closeBtn.graphics.beginFill("#FF4444").drawCircle(0, 0, 25);
            closeBtn.x = CANVAS_WIDTH - 50;
            closeBtn.y = 50;
            closeBtn.cursor = "pointer";
            
            var closeText = new createjs.Text("✕", "bold 20px Arial", "#FFFFFF");
            closeText.textAlign = "center";
            closeText.textBaseline = "middle";
            closeText.x = CANVAS_WIDTH - 50;
            closeText.y = 50;
            
            _oContainer.addChild(closeBtn);
            _oContainer.addChild(closeText);
            
            closeBtn.addEventListener("click", function() {
                this.hide();
            }.bind(this));
            
            console.log("⚠️ Fallback close button used - but_exit.png not found");
        }
    };
    
    this._createTabs = function() {
        var tabWidth = CANVAS_WIDTH / 4;
        var tabHeight = 60;
        var startY = 120;
        
        for (var i = 0; i < _aTabConfigs.length; i++) {
            var config = _aTabConfigs[i];
            var tabX = i * tabWidth;
            
            // Tab background
            var tabBg = new createjs.Shape();
            tabBg.graphics.beginFill("#2D1B69").drawRect(tabX, startY, tabWidth, tabHeight);
            tabBg.graphics.beginStroke("#FFD700").setStrokeStyle(2).drawRect(tabX, startY, tabWidth, tabHeight);
            
            // Tab text
            var tabText = new createjs.Text(config.title, "bold 14px Arial", "#FFFFFF");
            tabText.textAlign = "center";
            tabText.textBaseline = "middle";
            tabText.x = tabX + tabWidth / 2;
            tabText.y = startY + tabHeight / 2;
            
            _oContainer.addChild(tabBg);
            _oContainer.addChild(tabText);
            
            // Store tab reference
            _aTabs.push({
                id: config.id,
                bg: tabBg,
                text: tabText,
                x: tabX,
                y: startY,
                width: tabWidth,
                height: tabHeight
            });
            
            // Tab click event
            tabBg.cursor = "pointer";
            tabBg.addEventListener("click", this._onTabClick.bind(this, config.id));
        }
        
        // Highlight first tab
        this._highlightTab("global");
    };
    
    this._createContentArea = function() {
        // Content background
        var contentBg = new createjs.Shape();
        contentBg.graphics.beginFill("rgba(0,0,0,0.8)").drawRect(50, 200, CANVAS_WIDTH - 100, CANVAS_HEIGHT - 250);
        contentBg.graphics.beginStroke("#FFD700").setStrokeStyle(3).drawRect(50, 200, CANVAS_WIDTH - 100, CANVAS_HEIGHT - 250);
        
        _oContainer.addChild(contentBg);
        
        // Content container for dynamic content
        _oContentContainer = new createjs.Container();
        _oContentContainer.x = 50;
        _oContentContainer.y = 200;
        _oContainer.addChild(_oContentContainer);
    };
    
    this._createLoadingSpinner = function() {
        _oLoadingSpinner = new createjs.Shape();
        _oLoadingSpinner.graphics.beginFill("#FFD700").drawCircle(0, 0, 20);
        _oLoadingSpinner.x = CANVAS_WIDTH / 2;
        _oLoadingSpinner.y = CANVAS_HEIGHT / 2;
        _oLoadingSpinner.alpha = 0;
        
        _oContainer.addChild(_oLoadingSpinner);
    };
    
    // Online indicator methods removed from leaderboard
    
    this._onTabClick = function(tabId) {
        console.log("Tab clicked:", tabId);
        _sCurrentTab = tabId;
        this._highlightTab(tabId);
        this._showTabContent(tabId);
    };
    
    this._highlightTab = function(activeTabId) {
        for (var i = 0; i < _aTabs.length; i++) {
            var tab = _aTabs[i];
            if (tab.id === activeTabId) {
                tab.bg.graphics.clear();
                tab.bg.graphics.beginFill("#FFD700").drawRect(tab.x, tab.y, tab.width, tab.height);
                tab.text.color = "#000000";
            } else {
                tab.bg.graphics.clear();
                tab.bg.graphics.beginFill("#2D1B69").drawRect(tab.x, tab.y, tab.width, tab.height);
                tab.bg.graphics.beginStroke("#FFD700").setStrokeStyle(2).drawRect(tab.x, tab.y, tab.width, tab.height);
                tab.text.color = "#FFFFFF";
            }
        }
    };
    
    this._showTabContent = function(tabId) {
        // Clear previous content
        _oContentContainer.removeAllChildren();
        
        // Show loading
        this._showLoading(true);
        
        // Load and display data for this tab
        setTimeout(function() {
            this._loadTabData(tabId);
            this._showLoading(false);
        }.bind(this), 500);
    };
    
    this._loadTabData = function(tabId) {
        switch(tabId) {
            case "global":
                this._displayGlobalLeaderboard();
                break;
            case "achievements":
                this._displayAchievements();
                break;
            case "weekly":
                this._displayWeeklyChallenges();
                break;
            case "social":
                this._displaySocialFeatures();
                break;
        }
    };
    
    this._displayGlobalLeaderboard = function() {
        var titleText = new createjs.Text("🌍 Global Rankings", "bold 24px Arial", "#FFD700");
        titleText.textAlign = "center";
        titleText.x = (CANVAS_WIDTH - 100) / 2;
        titleText.y = 20;
        titleText.shadow = new createjs.Shadow("#000000", 2, 2, 4);
        _oContentContainer.addChild(titleText);
        
        // Get data from JSON leaderboard
        var leaderboardData = [];
        if (window.jsonLeaderboard && window.jsonLeaderboard.isInitialized()) {
            var jsonData = window.jsonLeaderboard.getAllLeaderboards();
            if (jsonData && jsonData.totalWinnings) {
                leaderboardData = jsonData.totalWinnings.slice(0, 10);
            }
        }
        
        if (leaderboardData.length === 0) {
            var noDataText = new createjs.Text("No global data available yet", "18px Arial", "#888888");
            noDataText.textAlign = "center";
            noDataText.x = (CANVAS_WIDTH - 100) / 2;
            noDataText.y = 100;
            _oContentContainer.addChild(noDataText);
            return;
        }
        
        // Display rankings
        var startY = 80;
        var rowHeight = 35;
        
        for (var i = 0; i < leaderboardData.length; i++) {
            var item = leaderboardData[i];
            var y = startY + (i * rowHeight);
            
            // Rank with medal
            var rankIcon = this._getRankIcon(i + 1);
            var rankText = new createjs.Text(rankIcon + " #" + (i + 1), "bold 16px Arial", "#FFD700");
            rankText.x = 20;
            rankText.y = y;
            _oContentContainer.addChild(rankText);
            
            // Player name
            var nameText = new createjs.Text(item.playerName || "Anonymous", "16px Arial", "#FFFFFF");
            nameText.x = 80;
            nameText.y = y;
            _oContentContainer.addChild(nameText);
            
            // Winnings
            var winningsText = new createjs.Text(item.totalWinnings.toFixed(2) + " MON", "16px Arial", "#00FF00");
            winningsText.x = CANVAS_WIDTH - 200;
            winningsText.y = y;
            _oContentContainer.addChild(winningsText);
            
            // Games played
            var gamesText = new createjs.Text(item.gamesPlayed + " games", "12px Arial", "#888888");
            gamesText.x = CANVAS_WIDTH - 120;
            gamesText.y = y + 15;
            _oContentContainer.addChild(gamesText);
        }
    };
    
    this._displayAchievements = function() {
        var titleText = new createjs.Text("🏆 Achievements", "bold 24px Arial", "#FFD700");
        titleText.textAlign = "center";
        titleText.x = (CANVAS_WIDTH - 100) / 2;
        titleText.y = 20;
        titleText.shadow = new createjs.Shadow("#000000", 2, 2, 4);
        _oContentContainer.addChild(titleText);
        
        // Get achievements from social features
        var achievements = [];
        if (window.socialFeatures && window.socialFeatures.isInitialized()) {
            achievements = window.socialFeatures.getPlayerAchievements("currentPlayer");
        }
        
        if (achievements.length === 0) {
            var noDataText = new createjs.Text("No achievements unlocked yet", "18px Arial", "#888888");
            noDataText.textAlign = "center";
            noDataText.x = (CANVAS_WIDTH - 100) / 2;
            noDataText.y = 100;
            _oContentContainer.addChild(noDataText);
            return;
        }
        
        // Display achievements
        var startY = 80;
        var rowHeight = 50;
        
        for (var i = 0; i < achievements.length; i++) {
            var achievement = achievements[i];
            var y = startY + (i * rowHeight);
            
            // Achievement icon
            var iconText = new createjs.Text(achievement.icon, "24px Arial", "#FFD700");
            iconText.x = 20;
            iconText.y = y;
            _oContentContainer.addChild(iconText);
            
            // Achievement title
            var titleText = new createjs.Text(achievement.title, "bold 16px Arial", "#FFFFFF");
            titleText.x = 60;
            titleText.y = y;
            _oContentContainer.addChild(titleText);
            
            // Achievement description
            var descText = new createjs.Text(achievement.description, "14px Arial", "#CCCCCC");
            descText.x = 60;
            descText.y = y + 20;
            _oContentContainer.addChild(descText);
            
            // Reward
            var rewardText = new createjs.Text(achievement.reward, "14px Arial", "#00FF00");
            rewardText.x = CANVAS_WIDTH - 150;
            rewardText.y = y;
            _oContentContainer.addChild(rewardText);
            
            // Share button
            var shareBtn = new createjs.Shape();
            shareBtn.graphics.beginFill("#4267B2").drawRect(0, 0, 60, 25);
            shareBtn.x = CANVAS_WIDTH - 200;
            shareBtn.y = y + 20;
            shareBtn.cursor = "pointer";
            
            var shareText = new createjs.Text("Share", "12px Arial", "#FFFFFF");
            shareText.textAlign = "center";
            shareText.textBaseline = "middle";
            shareText.x = CANVAS_WIDTH - 170;
            shareText.y = y + 32;
            
            _oContentContainer.addChild(shareBtn);
            _oContentContainer.addChild(shareText);
            
            shareBtn.addEventListener("click", function(achievement) {
                return function() {
                    if (window.socialFeatures) {
                        window.socialFeatures.shareAchievement(achievement);
                    }
                };
            }(achievement));
        }
    };
    
    this._displayWeeklyChallenges = function() {
        var titleText = new createjs.Text("📅 Weekly Challenges", "bold 24px Arial", "#FFD700");
        titleText.textAlign = "center";
        titleText.x = (CANVAS_WIDTH - 100) / 2;
        titleText.y = 20;
        titleText.shadow = new createjs.Shadow("#000000", 2, 2, 4);
        _oContentContainer.addChild(titleText);
        
        // Get weekly challenges
        var challenges = [];
        if (window.socialFeatures && window.socialFeatures.isInitialized()) {
            challenges = window.socialFeatures.getWeeklyChallenges();
        }
        
        if (challenges.length === 0) {
            var noDataText = new createjs.Text("No weekly challenges available", "18px Arial", "#888888");
            noDataText.textAlign = "center";
            noDataText.x = (CANVAS_WIDTH - 100) / 2;
            noDataText.y = 100;
            _oContentContainer.addChild(noDataText);
            return;
        }
        
        // Display challenges
        var startY = 80;
        var rowHeight = 80;
        
        for (var i = 0; i < challenges.length; i++) {
            var challenge = challenges[i];
            var y = startY + (i * rowHeight);
            
            // Challenge icon
            var iconText = new createjs.Text(challenge.icon, "24px Arial", "#FFD700");
            iconText.x = 20;
            iconText.y = y;
            _oContentContainer.addChild(iconText);
            
            // Challenge title
            var titleText = new createjs.Text(challenge.title, "bold 16px Arial", "#FFFFFF");
            titleText.x = 60;
            titleText.y = y;
            _oContentContainer.addChild(titleText);
            
            // Challenge description
            var descText = new createjs.Text(challenge.description, "14px Arial", "#CCCCCC");
            descText.x = 60;
            descText.y = y + 20;
            _oContentContainer.addChild(descText);
            
            // Reward
            var rewardText = new createjs.Text("Reward: " + challenge.reward, "14px Arial", "#00FF00");
            rewardText.x = 60;
            rewardText.y = y + 40;
            _oContentContainer.addChild(rewardText);
            
            // Leader
            if (challenge.leader) {
                var leaderText = new createjs.Text("Leader: " + challenge.leader.playerId, "12px Arial", "#FFD700");
                leaderText.x = CANVAS_WIDTH - 200;
                leaderText.y = y;
                _oContentContainer.addChild(leaderText);
                
                var leaderValueText = new createjs.Text(challenge.leader.value.toString(), "12px Arial", "#FFFFFF");
                leaderValueText.x = CANVAS_WIDTH - 200;
                leaderValueText.y = y + 15;
                _oContentContainer.addChild(leaderValueText);
            }
        }
    };
    
    this._displaySocialFeatures = function() {
        var titleText = new createjs.Text("👥 Social Features", "bold 24px Arial", "#FFD700");
        titleText.textAlign = "center";
        titleText.x = (CANVAS_WIDTH - 100) / 2;
        titleText.y = 20;
        titleText.shadow = new createjs.Shadow("#000000", 2, 2, 4);
        _oContentContainer.addChild(titleText);
        
        // Social features list
        var features = [
            "🏆 Achievement System - Unlock badges and rewards",
            "📱 Social Sharing - Share your achievements",
            "📅 Weekly Challenges - Compete with other players",
            "🌍 Global Leaderboards - See worldwide rankings",
            "🎮 Player Statistics - Track your progress"
        ];
        
        var startY = 80;
        var rowHeight = 30;
        
        for (var i = 0; i < features.length; i++) {
            var featureText = new createjs.Text(features[i], "16px Arial", "#FFFFFF");
            featureText.x = 20;
            featureText.y = startY + (i * rowHeight);
            _oContentContainer.addChild(featureText);
        }
        
        // Online players count removed from leaderboard
    };
    
    this._getRankIcon = function(rank) {
        switch(rank) {
            case 1: return "🥇";
            case 2: return "🥈";
            case 3: return "🥉";
            default: return "🏆";
        }
    };
    
    this._showLoading = function(show) {
        if (show) {
            _oLoadingSpinner.alpha = 1;
            createjs.Tween.get(_oLoadingSpinner, {loop: true})
                .to({rotation: 360}, 1000, createjs.Ease.linear);
        } else {
            createjs.Tween.get(_oLoadingSpinner).to({alpha: 0}, 300);
        }
    };
    
    this._loadLeaderboardData = function() {
        // Show initial tab content
        this._showTabContent("global");
    };
    
    this.show = function() {
        // Recreate container if it was removed
        if (!_oContainer || (typeof s_oStage !== 'undefined' && s_oStage && !s_oStage.contains(_oContainer))) {
            this._init();
        }
        
        _bIsVisible = true;
        createjs.Tween.get(_oContainer).to({alpha: 1}, 500, createjs.Ease.quadOut);
        
        // Add ESC key listener
        this._escKeyHandler = function(event) {
            if (event.keyCode === 27) { // ESC key
                this.hide();
                document.removeEventListener('keydown', this._escKeyHandler);
            }
        }.bind(this);
        document.addEventListener('keydown', this._escKeyHandler);
        
        console.log("🏆 Global Leaderboard shown");
    };
    
    this.hide = function() {
        _bIsVisible = false;
        
        // Remove ESC key listener
        if (this._escKeyHandler) {
            document.removeEventListener('keydown', this._escKeyHandler);
            this._escKeyHandler = null;
        }
        
        createjs.Tween.get(_oContainer).to({alpha: 0}, 300, createjs.Ease.quadIn).call(function() {
            // Completely remove from stage after animation
            if (_oContainer && typeof s_oStage !== 'undefined' && s_oStage && s_oStage.contains(_oContainer)) {
                s_oStage.removeChild(_oContainer);
            }
        });
        console.log("🏆 Global Leaderboard hidden");
    };
    
    this.isVisible = function() {
        return _bIsVisible;
    };
    
    this.unload = function() {
        // Clean up exit button
        if (_oButExit) {
            _oButExit.unload();
            _oButExit = null;
        }
        
        if (_oContainer && typeof s_oStage !== 'undefined' && s_oStage && s_oStage.contains(_oContainer)) {
            s_oStage.removeChild(_oContainer);
        }
    };
    
    this._init();
}
