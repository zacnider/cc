function CMsgBox(szText,oParentContainer){
    var _oMsg;
    var _oButOk;
    var _oThis;
    var _oContainer;
    var _oParentContainer;

    this._init = function (szText) {
        _oContainer = new createjs.Container();
        _oParentContainer.addChild(_oContainer);

        var oFade;

        oFade = new createjs.Shape();
        oFade.graphics.beginFill("black").drawRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        oFade.alpha = 0.5;

        oFade.on("click", function () {});

        _oContainer.addChild(oFade);

        var oSpriteBg = s_oSpriteLibrary.getSprite('msg_box');
        var oBg = createBitmap(oSpriteBg);

        oBg.x = CANVAS_WIDTH * 0.5;
        oBg.y = CANVAS_HEIGHT * 0.5;
        oBg.regX = oSpriteBg.width * 0.5;
        oBg.regY = oSpriteBg.height * 0.5;
        _oContainer.addChild(oBg);

        _oMsg = new createjs.Text(szText, "28px " + PRIMARY_FONT, "#fff");
        var oMsgOut = new createjs.Text(szText, "28px " + PRIMARY_FONT, "#000000");
        oMsgOut.outline = 3;
        _oMsg.x = CANVAS_WIDTH / 2 + 260;
        _oMsg.y = 630;
        _oMsg.textAlign = "right";
        _oMsg.textBaseline = "middle";
        _oMsg.lineWidth = 500;
        oMsgOut.x = CANVAS_WIDTH / 2 + 260;
        oMsgOut.y = 630;
        oMsgOut.textAlign = "right";
        oMsgOut.textBaseline = "middle";
        oMsgOut.lineWidth = 500;
        _oContainer.addChild(oMsgOut);

        _oContainer.addChild(_oMsg);


        _oButOk = new CGfxButton(CANVAS_WIDTH / 2, 1030, s_oSpriteLibrary.getSprite('but_yes'), _oContainer);
        _oButOk.addEventListener(ON_MOUSE_UP, this._onButOk, this);
    };

    this._onButOk = function () {
        _oThis.unload();
    };

    this.unload = function () {
        _oButOk.unload();
        _oParentContainer.removeChild(_oContainer);
    };
    
    _oThis = this;
    _oParentContainer = oParentContainer;

    this._init(szText);
}