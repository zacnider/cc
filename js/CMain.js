function CMain(oData) {
    var _bUpdate;
    var _iCurResource = 0;
    var RESOURCE_TO_LOAD = 0;
    var _iState = STATE_LOADING;
    var _oData;
    var _oPreloader;
    var _oMenu;
    var _oGame;
    var _oLevelMenu;

    this.initContainer = function () {
        try {
            s_oCanvas = document.getElementById("canvas");
            
            // Canvas performance optimization for getImageData operations
            s_oCanvas.willReadFrequently = true;
            
            // Additional canvas optimizations
            s_oCanvas.style.imageRendering = 'pixelated';
            s_oCanvas.style.imageRendering = '-moz-crisp-edges';
            s_oCanvas.style.imageRendering = 'crisp-edges';
            
            s_oStage = new createjs.Stage(s_oCanvas);
            s_oStage.preventSelection = false;
            createjs.Touch.enable(s_oStage);

            s_bMobile = jQuery.browser.mobile;
            if (s_bMobile === false) {
                s_oStage.enableMouseOver(20);
                $('body').on('contextmenu', '#canvas', function (e) {
                    return false;
                });
            }

            s_iPrevTime = new Date().getTime();

            createjs.Ticker.addEventListener("tick", this._update);
            createjs.Ticker.setFPS(FPS);

            if (navigator.userAgent.match(/Windows Phone/i)) {
                DISABLE_SOUND_MOBILE = true;
            }

            s_oSpriteLibrary = new CSpriteLibrary();

            // Register instances with GameManager
            if (window.gameManager) {
                window.gameManager.setMain(this);
                window.gameManager.setStage(s_oStage);
                window.gameManager.setSpriteLibrary(s_oSpriteLibrary);
                window.gameManager.setCanvas(s_oCanvas);
                window.gameManager.setMobile(s_bMobile);
            }

            // Log initialization
            if (window.errorLogger) {
                window.errorLogger.info('CMain container initialized', {
                    canvasWidth: CANVAS_WIDTH,
                    canvasHeight: CANVAS_HEIGHT,
                    mobile: s_bMobile,
                    fps: FPS
                });
            }

            //ADD PRELOADER
            _oPreloader = new CPreloader();
            
        } catch (error) {
            if (window.errorLogger) {
                window.errorLogger.error('CMain container initialization failed', {
                    error: error.message,
                    stack: error.stack
                });
            }
            throw error;
        }
    };

    this.preloaderReady = function () {
        if (DISABLE_SOUND_MOBILE === false || s_bMobile === false) {
            this._initSounds();
        }

        this._loadImages();
        _bUpdate = true;
    };

    this.soundLoaded = function () {
        _iCurResource++;
        var iPerc = Math.floor(_iCurResource / RESOURCE_TO_LOAD * 100);
        _oPreloader.refreshLoader(iPerc);

        if (_iCurResource === RESOURCE_TO_LOAD) {
            s_oMain._onRemovePreloader();
        }
    };
    
    this._initSounds = function(){
        var aSoundsInfo = new Array();
        aSoundsInfo.push({path: './sounds/',filename:'footstep',loop:false,volume:1, ingamename: 'footstep'});
        aSoundsInfo.push({path: './sounds/',filename:'click',loop:false,volume:1, ingamename: 'click'});
        aSoundsInfo.push({path: './sounds/',filename:'jump',loop:false,volume:1, ingamename: 'jump'});
        aSoundsInfo.push({path: './sounds/',filename:'splash',loop:false,volume:1, ingamename: 'splash'});
        aSoundsInfo.push({path: './sounds/',filename:'soundtrack',loop:true,volume:1, ingamename: 'soundtrack'});
        
        RESOURCE_TO_LOAD += aSoundsInfo.length;

        s_aSounds = new Array();
        for(var i=0; i<aSoundsInfo.length; i++){
            s_aSounds[aSoundsInfo[i].ingamename] = new Howl({ 
                                                            src: [aSoundsInfo[i].path+aSoundsInfo[i].filename+'.mp3', aSoundsInfo[i].path+aSoundsInfo[i].filename+'.ogg'],
                                                            autoplay: false,
                                                            preload: true,
                                                            loop: aSoundsInfo[i].loop, 
                                                            volume: aSoundsInfo[i].volume,
                                                            onload: s_oMain.soundLoaded
                                                        });
        }
        
    };  

    
    this._loadImages = function () {
        s_oSpriteLibrary.init(this._onImagesLoaded, this._onAllImagesLoaded, this);

        s_oSpriteLibrary.addSprite("bg_menu", "./sprites/bg_menu2.png");
        s_oSpriteLibrary.addSprite("but_exit", "./sprites/but_exit.png");
        s_oSpriteLibrary.addSprite("audio_icon", "./sprites/audio_icon.png");
        s_oSpriteLibrary.addSprite("but_play", "./sprites/but_play.png");
        s_oSpriteLibrary.addSprite("but_restart", "./sprites/but_restart.png");
        s_oSpriteLibrary.addSprite("but_home", "./sprites/but_home.png");
        s_oSpriteLibrary.addSprite("but_continue", "./sprites/but_continue.png");
        s_oSpriteLibrary.addSprite("msg_box", "./sprites/msg_box.png");
        s_oSpriteLibrary.addSprite("but_credits", "./sprites/but_credits.png");
        s_oSpriteLibrary.addSprite("but_leaderboard", "./sprites/but_leaderboard.png");
        s_oSpriteLibrary.addSprite("logo_ctl", "./sprites/logo_ctl.png");
        s_oSpriteLibrary.addSprite("but_fullscreen", "./sprites/but_fullscreen.png");
        s_oSpriteLibrary.addSprite("but_continue", "./sprites/but_continue.png");
        // s_oSpriteLibrary.addSprite("bg_end_panel", "./sprites/bg_end_panel.png"); // Dosya bulunamadı
        // s_oSpriteLibrary.addSprite("bg_help_panel", "./sprites/bg_help_panel.png"); // Dosya bulunamadı
        s_oSpriteLibrary.addSprite("bg_game", "./sprites/bg3.png");
        s_oSpriteLibrary.addSprite("bg_game_1", "./sprites/bg3.png");
        s_oSpriteLibrary.addSprite("bg_game_2", "./sprites/bg3.png");
        s_oSpriteLibrary.addSprite("but_no", "./sprites/but_no.png");
        s_oSpriteLibrary.addSprite("but_yes", "./sprites/but_yes.png");
        s_oSpriteLibrary.addSprite("but_restart_small", "./sprites/but_restart_small.png");
        // Eski kutukno sprite'ları kaldırıldı - artık platform.png sprite sheet kullanılıyor
        s_oSpriteLibrary.addSprite("hero", "./sprites/idlesprite.png");
        s_oSpriteLibrary.addSprite("hero_jump", "./sprites/jumpsprite.png");
        s_oSpriteLibrary.addSprite("platform_spritesheet", "./sprites/platform.png");
        s_oSpriteLibrary.addSprite("first_platform", "./sprites/firstplatform.webp");
    s_oSpriteLibrary.addSprite("sea_spritesheet", "./sprites/sea_spritesheet.png");
    s_oSpriteLibrary.addSprite("sharkidle", "./sprites/sharkidle.png");
    s_oSpriteLibrary.addSprite("sharkattack", "./sprites/spritesheet.png");
    s_oSpriteLibrary.addSprite("celebration", "./sprites/celebration.png");

        RESOURCE_TO_LOAD += s_oSpriteLibrary.getNumSprites();
        s_oSpriteLibrary.loadSprites();
    };

    this._onImagesLoaded = function () {
        _iCurResource++;
        var iPerc = Math.floor(_iCurResource / RESOURCE_TO_LOAD * 100);
        _oPreloader.refreshLoader(iPerc);
        
        if (_iCurResource === RESOURCE_TO_LOAD) {
            this._onRemovePreloader();
        }
    };

    this._onAllImagesLoaded = function () {
        
    };
    
    this._onRemovePreloader = function(){
        try{
            saveItem("ls_available","ok");
        }catch(evt){
            // localStorage not defined
            s_bStorageAvailable = false;
        }

        _oPreloader.unload();

        if (!isIOS()) {
            s_oSoundTrack = playSound("soundtrack", 1,true);      
        }
        

        this.gotoMenu();
    };
    
    this.gotoMenu = function () {
        _oMenu = new CMenu();
        _iState = STATE_MENU;
    };

    this.gotoGame = function (iLevel) {
        _oGame = new CGame(_oData, iLevel || 1);
        _iState = STATE_GAME;

        $(s_oMain).trigger("start_session");
    };

    this.stopUpdate = function(){
        _bUpdate = false;
        createjs.Ticker.paused = true;
        $("#block_game").css("display","block");
        
        if(DISABLE_SOUND_MOBILE === false || s_bMobile === false){
            Howler.mute(true);
        }
        
    };

    this.startUpdate = function(){
        s_iPrevTime = new Date().getTime();
        _bUpdate = true;
        createjs.Ticker.paused = false;
        $("#block_game").css("display","none");
        
        if(DISABLE_SOUND_MOBILE === false || s_bMobile === false){
            if(s_bAudioActive){
                Howler.mute(false);
            }
        }
        
    };

    this._update = function (event) {
        if (_bUpdate === false) {
            return;
        }
        var iCurTime = new Date().getTime();
        s_iTimeElaps = iCurTime - s_iPrevTime;
        s_iCntTime += s_iTimeElaps;
        s_iCntFps++;
        s_iPrevTime = iCurTime;

        if (s_iCntTime >= 1000) {
            s_iCurFps = s_iCntFps;
            s_iCntTime -= 1000;
            s_iCntFps = 0;
        }

        if (_iState === STATE_GAME) {
            _oGame.update();
        }

        s_oStage.update(event);

    };

    s_oMain = this;

    _oData = oData;
    ENABLE_FULLSCREEN = oData.fullscreen;
    ENABLE_CHECK_ORIENTATION = oData.check_orientation;

    this.initContainer();
}

var s_bMobile;
var s_bAudioActive = true;
var s_bFullscreen = false;
var s_iCntTime = 0;
var s_iTimeElaps = 0;
var s_iPrevTime = 0;
var s_iCntFps = 0;
var s_iCurFps = 0;

var s_iLevelReached = 1;

var s_oDrawLayer;
var s_oStage;
var s_oMain;
var s_oSpriteLibrary;
var s_oSoundTrack = null;
var s_oCanvas;
var s_iBestScore = 0;

var s_bStorageAvailable = true;
var s_aSounds;