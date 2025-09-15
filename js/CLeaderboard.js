function CLeaderboard() {
    var _oContainer;
    var _oBackground;
    var _aTabs = [];
    var _sCurrentTab = "topWinnings";
    var _aLeaderboardData = {};
    var _bIsVisible = false;
    var _oLoadingSpinner;
    
    // Tab configurations
    var _aTabConfigs = [
        {
            id: "topWinnings",
            title: "💰 Top Winnings",
            icon: "💰",
            description: "Highest total winnings"
        },
        {
            id: "longestStreak", 
            title: "🏃‍♂️ Longest Streak",
            icon: "🏃‍♂️",
            description: "Most consecutive successful jumps"
        },
        {
            id: "highestMultiplier",
            title: "⚡ Highest Multiplier", 
            icon: "⚡",
            description: "Highest multiplier achieved"
        },
        {
            id: "highestRisk",
            title: "🎲 Highest Risk",
            icon: "🎲", 
            description: "Highest bet amounts"
        },
        {
            id: "fastestWin",
            title: "⚡ Fastest Win",
            icon: "⚡",
            description: "Quickest successful games"
        }
    ];
    
    this._init = function() {
        _oContainer = new createjs.Container();
        _oContainer.alpha = 0;
        s_oStage.addChild(_oContainer);
        
        this._createBackground();
        this._createTabs();
        this._createContentArea();
        this._createLoadingSpinner();
        
        // Load initial data
        this._loadLeaderboardData();
        
        console.log("🏆 Chog Cross Leaderboard initialized with 5 tabs");
    };
    
    this._createBackground = function() {
        // Main background
        _oBackground = new createjs.Shape();
        _oBackground.graphics.beginLinearGradientFill(
            ["#1A0B3D", "#2D1B69", "#4A0E4E"], 
            [0, 0.5, 1], 
            0, 0, 0, CANVAS_HEIGHT
        ).drawRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // Make background clickable to close
        _oBackground.addEventListener("click", function() {
            console.log("❌ Background clicked - closing leaderboard");
            this.hide();
        }.bind(this));
        
        _oContainer.addChild(_oBackground);
        
        // Title
        var titleText = new createjs.Text("🏆 CHOG CROSS LEADERBOARD", "bold 36px Arial", "#FFD700");
        titleText.textAlign = "center";
        titleText.x = CANVAS_WIDTH / 2;
        titleText.y = 50;
        titleText.shadow = new createjs.Shadow("#000000", 3, 3, 6);
        _oContainer.addChild(titleText);
        
        // Close button
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
        
        // Close button event - multiple event types for better compatibility
        closeBtn.addEventListener("click", function() {
            console.log("❌ Close button clicked!");
            this.hide();
        }.bind(this));
        
        closeBtn.addEventListener("mousedown", function() {
            console.log("❌ Close button mousedown!");
            this.hide();
        }.bind(this));
        
        // Also make the text clickable
        closeText.addEventListener("click", function() {
            console.log("❌ Close text clicked!");
            this.hide();
        }.bind(this));
    };
    
    this._createTabs = function() {
        var tabWidth = CANVAS_WIDTH / 5;
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
        this._highlightTab("topWinnings");
    };
    
    this._createContentArea = function() {
        // Content background
        var contentBg = new createjs.Shape();
        contentBg.graphics.beginFill("rgba(0,0,0,0.8)").drawRect(50, 200, CANVAS_WIDTH - 100, CANVAS_HEIGHT - 250);
        contentBg.graphics.beginStroke("#FFD700").setStrokeStyle(3).drawRect(50, 200, CANVAS_WIDTH - 100, CANVAS_HEIGHT - 250);
        
        _oContainer.addChild(contentBg);
        
        // Content container for dynamic content
        this._oContentContainer = new createjs.Container();
        this._oContentContainer.x = 50;
        this._oContentContainer.y = 200;
        _oContainer.addChild(this._oContentContainer);
    };
    
    this._createLoadingSpinner = function() {
        _oLoadingSpinner = new createjs.Shape();
        _oLoadingSpinner.graphics.beginFill("#FFD700").drawCircle(0, 0, 20);
        _oLoadingSpinner.x = CANVAS_WIDTH / 2;
        _oLoadingSpinner.y = CANVAS_HEIGHT / 2;
        _oLoadingSpinner.alpha = 0;
        
        _oContainer.addChild(_oLoadingSpinner);
    };
    
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
        this._oContentContainer.removeAllChildren();
        
        // Show loading
        this._showLoading(true);
        
        // Load and display data for this tab
        this._loadTabData(tabId);
    };
    
    this._loadTabData = function(tabId) {
        var data = _aLeaderboardData[tabId] || [];
        this._displayTabData(tabId, data);
        this._showLoading(false);
    };
    
    this._displayTabData = function(tabId, data) {
        var config = _aTabConfigs.find(t => t.id === tabId);
        
        // Tab title
        var titleText = new createjs.Text(config.title, "bold 24px Arial", "#FFD700");
        titleText.textAlign = "center";
        titleText.x = (CANVAS_WIDTH - 100) / 2;
        titleText.y = 20;
        titleText.shadow = new createjs.Shadow("#000000", 2, 2, 4);
        this._oContentContainer.addChild(titleText);
        
        // Description
        var descText = new createjs.Text(config.description, "16px Arial", "#CCCCCC");
        descText.textAlign = "center";
        descText.x = (CANVAS_WIDTH - 100) / 2;
        descText.y = 50;
        this._oContentContainer.addChild(descText);
        
        // Data rows
        var startY = 100;
        var rowHeight = 40;
        
        if (data.length === 0) {
            var noDataText = new createjs.Text("No data available yet", "18px Arial", "#888888");
            noDataText.textAlign = "center";
            noDataText.x = (CANVAS_WIDTH - 100) / 2;
            noDataText.y = startY + 50;
            this._oContentContainer.addChild(noDataText);
            return;
        }
        
        for (var i = 0; i < Math.min(data.length, 10); i++) {
            var item = data[i];
            var y = startY + (i * rowHeight);
            
            // Rank
            var rankText = new createjs.Text("#" + (i + 1), "bold 18px Arial", "#FFD700");
            rankText.x = 20;
            rankText.y = y;
            this._oContentContainer.addChild(rankText);
            
            // Player name
            var nameText = new createjs.Text(item.playerName || "Anonymous", "16px Arial", "#FFFFFF");
            nameText.x = 80;
            nameText.y = y;
            this._oContentContainer.addChild(nameText);
            
            // Value based on tab type
            var valueText = this._getValueText(tabId, item);
            valueText.x = CANVAS_WIDTH - 200;
            valueText.y = y;
            this._oContentContainer.addChild(valueText);
            
            // Date
            var dateText = new createjs.Text(this._formatDate(item.date), "12px Arial", "#888888");
            dateText.x = CANVAS_WIDTH - 120;
            dateText.y = y + 15;
            this._oContentContainer.addChild(dateText);
        }
    };
    
    this._getValueText = function(tabId, item) {
        var value, color = "#00FF00";
        
        switch(tabId) {
            case "topWinnings":
                value = item.winnings.toFixed(2) + " MON";
                break;
            case "longestStreak":
                value = item.successfulJumps + " jumps";
                break;
            case "highestMultiplier":
                value = item.multiplier.toFixed(2) + "x";
                break;
            case "highestRisk":
                value = item.betAmount.toFixed(1) + " MON";
                break;
            case "fastestWin":
                value = item.gameTime + "s";
                break;
        }
        
        return new createjs.Text(value, "16px Arial", color);
    };
    
    this._formatDate = function(dateString) {
        var date = new Date(dateString);
        return date.toLocaleDateString();
    };
    
    this._loadLeaderboardData = function() {
        // Load data from JSON database
        console.log("📊 Loading leaderboard data from JSON database...");
        
        if (window.jsonLeaderboard && window.jsonLeaderboard.isInitialized()) {
            // Get data from JSON leaderboard
            var jsonData = window.jsonLeaderboard.getAllLeaderboards();
            
            if (jsonData) {
                // Map JSON data to our tab structure
                _aLeaderboardData = {
                    topWinnings: jsonData.totalWinnings || [],
                    longestStreak: jsonData.bestStreak || [],
                    highestMultiplier: jsonData.highestMultiplier || [],
                    highestRisk: jsonData.mostRisky || [],
                    fastestWin: jsonData.fastestTime || []
                };
                
                console.log("✅ JSON leaderboard data loaded successfully");
            } else {
                console.log("⚠️ No JSON data available, using empty data");
                _aLeaderboardData = {
                    topWinnings: [],
                    longestStreak: [],
                    highestMultiplier: [],
                    highestRisk: [],
                    fastestWin: []
                };
            }
        } else {
            console.log("⚠️ JSON leaderboard not initialized, using empty data");
            _aLeaderboardData = {
                topWinnings: [],
                longestStreak: [],
                highestMultiplier: [],
                highestRisk: [],
                fastestWin: []
            };
        }
        
        // Show initial tab content
        this._showTabContent("topWinnings");
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
    
    this.show = function() {
        // Recreate container if it was removed
        if (!_oContainer || !s_oStage.contains(_oContainer)) {
            this._init();
        }
        
        _bIsVisible = true;
        createjs.Tween.get(_oContainer).to({alpha: 1}, 500, createjs.Ease.quadOut);
        
        // Add ESC key listener
        this._escKeyHandler = function(event) {
            if (event.keyCode === 27) { // ESC key
                console.log("❌ ESC key pressed - closing leaderboard");
                this.hide();
                document.removeEventListener('keydown', this._escKeyHandler);
            }
        }.bind(this);
        document.addEventListener('keydown', this._escKeyHandler);
        
        console.log("🏆 Leaderboard shown");
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
            if (_oContainer && s_oStage.contains(_oContainer)) {
                s_oStage.removeChild(_oContainer);
            }
        });
        console.log("🏆 Leaderboard hidden");
    };
    
    this.isVisible = function() {
        return _bIsVisible;
    };
    
    this.unload = function() {
        if (_oContainer && s_oStage.contains(_oContainer)) {
            s_oStage.removeChild(_oContainer);
        }
    };
    
    this._init();
}
