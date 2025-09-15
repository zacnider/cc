function CHowToPanel(){
    
    var _oBg;
    var _oButExit;
    var _oFade;
    var _oHitArea;
    var _oContainer;
    var _oScrollContainer;
    var _oScrollMask;
    var _pStartPosExit;
    var _fScrollY = 0;
    var _fMaxScroll = 0;
    var _aInstructions = []; // Instructions array'i global olarak tanımla
    var _bTouchScrolling = false;
    var _fTouchStartY = 0;
    var _fTouchStartScroll = 0;
    
    this._init = function(){
        // Fade background
        _oFade = new createjs.Shape();
        _oFade.graphics.beginFill("black").drawRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
        _oFade.alpha = 0;
        s_oStage.addChild(_oFade);
        new createjs.Tween.get(_oFade).to({alpha:0.8},500);
        
        // Main container
        _oContainer = new createjs.Container();
        _oContainer.y = CANVAS_HEIGHT + 100; 
        s_oStage.addChild(_oContainer);
        
        // Background panel (aşağı kaydırıldı)
        _oBg = new createjs.Shape();
        _oBg.graphics.beginLinearGradientFill(
            ["#4A0E4E", "#2D1B69", "#1A0B3D"], 
            [0, 0.5, 1], 
            0, 0, 0, 400
        ).drawRoundRect(0, 0, 500, 500, 20);
        _oBg.x = (CANVAS_WIDTH - 500) / 2;
        _oBg.y = (CANVAS_HEIGHT - 500) / 2 + 50; // 50px aşağı kaydırıldı
        _oContainer.addChild(_oBg);
        
        // Golden border (aşağı kaydırıldı)
        var panelBorder = new createjs.Shape();
        panelBorder.graphics.beginStroke("#FFD700").setStrokeStyle(4).drawRoundRect(0, 0, 500, 500, 20);
        panelBorder.x = (CANVAS_WIDTH - 500) / 2;
        panelBorder.y = (CANVAS_HEIGHT - 500) / 2 + 50; // 50px aşağı kaydırıldı
        _oContainer.addChild(panelBorder);
        
        // Hit area kaldırıldı - sadece exit butonu ile kapanacak
        
        // Exit button (aşağı kaydırıldı)
        var oSprite = s_oSpriteLibrary.getSprite('but_exit');
        _pStartPosExit = {x: (CANVAS_WIDTH - 500) / 2 + 500 - 40, y: (CANVAS_HEIGHT - 500) / 2 + 70}; // 50px aşağı kaydırıldı
        _oButExit = new CGfxButton(_pStartPosExit.x, _pStartPosExit.y, oSprite, _oContainer);
        _oButExit.addEventListener(ON_MOUSE_UP, this.unload, this);
        
        // Title (aşağı kaydırıldı)
        var titleText = new createjs.Text("HOW TO PLAY", "bold 28px Arial", "#FFD700");
        titleText.textAlign = "center";
        titleText.textBaseline = "middle";
        titleText.x = CANVAS_WIDTH / 2;
        titleText.y = (CANVAS_HEIGHT - 500) / 2 + 100; // 50px aşağı kaydırıldı
        titleText.shadow = new createjs.Shadow("#000000", 3, 3, 6);
        _oContainer.addChild(titleText);
        
        // Scroll container oluştur (aşağı kaydırıldı)
        _oScrollContainer = new createjs.Container();
        _oScrollContainer.x = (CANVAS_WIDTH - 500) / 2 + 20;
        _oScrollContainer.y = (CANVAS_HEIGHT - 500) / 2 + 150; // 50px aşağı kaydırıldı
        _oContainer.addChild(_oScrollContainer);
        
        // Scroll alanı için görsel sınır (aşağı kaydırıldı)
        var scrollBorder = new createjs.Shape();
        scrollBorder.graphics.beginStroke("#FFD700").setStrokeStyle(2).drawRect(0, 0, 460, 350);
        scrollBorder.x = (CANVAS_WIDTH - 500) / 2 + 20;
        scrollBorder.y = (CANVAS_HEIGHT - 500) / 2 + 140; // 50px aşağı kaydırıldı
        _oContainer.addChild(scrollBorder);
        
        // Instructions (scroll container içinde)
        _aInstructions = [
            "💰 BETTING SYSTEM 💰",
            "",
            "1. Set your bet amount (1.0 - 5.0 MON)",
            "2. Choose difficulty: Easy or Hard",
            "3. Click PLAY to start jumping",
            "",
            "🎯 GAMEPLAY 🎯",
            "",
            "• Press SPACE or click to jump",
            "• Land on platforms to increase multiplier",
            "",
            "⚠️ RISK SYSTEM ⚠️",
            "",
            "• Each jump has a fail risk",
            "• Risk increases with each successful jump",
            "• Higher bets = higher risk",
            "• Hard mode = higher risk",
            "",
            "🦈 FAIL CONSEQUENCES 🦈",
            "",
            "• If you fail, shark attacks!",
            "• You lose your bet amount",
            "• Game over screen appears",
            "",
            "💎 CASHOUT SYSTEM 💎",
            "",
            "• Cash out anytime to secure winnings",
            "• Reach final platform for celebration",
            "",
            "🎮 CONTROLS 🎮",
            "",
            "• SPACE key or mouse click to jump",
            "• Use mouse wheel to scroll this panel",
            "• Touch and drag to scroll on mobile",
            "• Click X button to close panel",
            "",
            "💡 TIPS 💡",
            "",
            "• Start with small bets to learn",
            "• Easy mode has lower risk",
            "• Cash out early to secure profits",
            "• Watch the multiplier carefully",
            "• Don't get greedy!"
        ];
        
        var yOffset = 0;
        for (var i = 0; i < _aInstructions.length; i++) {
            var instructionText = new createjs.Text(_aInstructions[i], "bold 14px Arial", "#FFFFFF");
            instructionText.textAlign = "left";
            instructionText.textBaseline = "middle";
            instructionText.x = 20;
            instructionText.y = yOffset + (i * 18); // Satır aralığı azaltıldı
            instructionText.shadow = new createjs.Shadow("#000000", 2, 2, 4);
            _oScrollContainer.addChild(instructionText);
        }
        
        // İlk görünürlük kontrolü
        this.updateTextVisibility();
        
        // Max scroll hesapla
        this.calculateMaxScroll();
        
        // Mouse wheel event ekle
        this.addMouseWheelEvent();
        
        // Touch events ekle (mobil için)
        this.addTouchEvents();
        
        // Animate panel entrance
        new createjs.Tween.get(_oContainer).to({y:0},1000, createjs.Ease.backOut);
    };
    
    // Max scroll hesapla (mask boyutuna göre)
    this.calculateMaxScroll = function() {
        _fMaxScroll = Math.max(0, (_aInstructions.length * 18) - 350); // Mask yüksekliği: 350px
    };
    
    // Mouse wheel event ekle
    this.addMouseWheelEvent = function() {
        var self = this;
        $(document).on('wheel', function(e) {
            if (_oContainer && _oContainer.parent) {
                var delta = e.originalEvent.deltaY;
                self.scrollContent(-delta * 0.5);
            }
        });
    };
    
    // Touch events ekle (mobil için)
    this.addTouchEvents = function() {
        var self = this;
        
        // Touch start
        _oScrollContainer.on("mousedown", function(e) {
            if (e.nativeEvent && e.nativeEvent.touches) {
                _bTouchScrolling = true;
                _fTouchStartY = e.nativeEvent.touches[0].clientY;
                _fTouchStartScroll = _fScrollY;
            }
        });
        
        // Touch move
        _oScrollContainer.on("pressmove", function(e) {
            if (_bTouchScrolling && e.nativeEvent && e.nativeEvent.touches) {
                var deltaY = e.nativeEvent.touches[0].clientY - _fTouchStartY;
                var newScroll = _fTouchStartScroll - deltaY; // Touch'ta ters yön
                self.scrollContent(newScroll - _fScrollY);
            }
        });
        
        // Touch end
        _oScrollContainer.on("pressup", function(e) {
            _bTouchScrolling = false;
        });
    };
    
    // İçeriği kaydır (text elementlerinin görünürlüğünü kontrol et)
    this.scrollContent = function(deltaY) {
        _fScrollY += deltaY;
        _fScrollY = Math.max(0, Math.min(_fScrollY, _fMaxScroll));
        
        // Scroll container'ı hareket ettir
        _oScrollContainer.y = (CANVAS_HEIGHT - 500) / 2 + 100 - _fScrollY;
        
        // Text elementlerinin görünürlüğünü kontrol et
        this.updateTextVisibility();
    };
    
    // Text elementlerinin görünürlüğünü güncelle
    this.updateTextVisibility = function() {
        var scrollAreaTop = (CANVAS_HEIGHT - 500) / 2 + 100;
        var scrollAreaBottom = scrollAreaTop + 350;
        
        for (var i = 0; i < _oScrollContainer.children.length; i++) {
            var textElement = _oScrollContainer.children[i];
            var textY = textElement.y + _oScrollContainer.y;
            
            // Text elementinin scroll alanı içinde olup olmadığını kontrol et
            if (textY >= scrollAreaTop && textY <= scrollAreaBottom) {
                textElement.visible = true;
            } else {
                textElement.visible = false;
            }
        }
    };
    
    this.unload = function(){
        // Mouse wheel event'i kaldır
        $(document).off('wheel');
        
        // Touch events'i kaldır
        if (_oScrollContainer) {
            _oScrollContainer.off("mousedown");
            _oScrollContainer.off("pressmove");
            _oScrollContainer.off("pressup");
        }
        
        _oButExit.unload(); 
        _oButExit = null;
        
        s_oStage.removeChild(_oFade);
        s_oStage.removeChild(_oContainer);

        s_oMenu.exitFromHowTo();
    };
    
    this._init();
}
