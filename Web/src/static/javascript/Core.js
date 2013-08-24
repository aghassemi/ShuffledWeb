(function(){

'use strict';

var curUrls = [];
var curIndex = 0;
var wait = false;
var iframeQueue = [];

var waitQueue = [];

var numCacheIFrames = 5;

function loadiframe(iframe) {

    if (wait) {
        waitQueue.push(iframe);
        return;
    }
    var setSrc = function () {
        var curriframe = iframe[0];
        curriframe.src = 'about:blank';
        curriframe.allowTransparency = false;
        setTimeout(function () {
            curriframe.src = 'http://www.' + curUrls[curIndex];
            curIndex++;$('.sw-url').val( iframeQueue[0].attr('src') );
            $('.sw-url').val( iframeQueue[0].attr('src') );
        }, 0);

    };

    if (curUrls.length - 1 <= curIndex) {
        wait = true;
        loadMoreUrls().done(function () {
            wait = false;
            setSrc();
            for (var i = 0; i < waitQueue.length; i++) {
                loadiframe(waitQueue[i]);
            }
            waitQueue = [];
        });
    } else {
        setSrc();
    }

    if (!wait && curIndex > curUrls.length - 15 ) {
        loadMoreUrls();
    }
};

function next() {

    $(document.body).addClass('sw-loading');
    var iframe = iframeQueue.shift();
    iframe.parent().addClass('sw-hidden');
    iframeQueue[0].parent().removeClass('sw-hidden');
    
    loadiframe(iframe);
    iframeQueue.push(iframe);

};

function loadMoreUrls() {

    var success = function (urls) {
        curUrls = curUrls.concat(urls);
    };

    var ajax = $.ajax({
        url: "/n/rpc/next",
        dataType: 'json',
        success: success
    });

    return ajax;
};

function initIFrames() {

    for( var i = 0; i < numCacheIFrames; i++ ) {
        var iframeWrapper = document.createElement('div');
        iframeWrapper.className = 'sw-iframe-wrapper sw-hidden';

        var iframeObj = $('<iframe class="sw-iframe" src="about:blank" allowTransparency="false"></iframe>');
        iframeObj.appendTo( iframeWrapper );

        iframeQueue.push(iframeObj);

        iframeObj.load(function () {
            if (iframeObj[0].src != 'about:blank') {
                $(document.body).removeClass('sw-loading');
            }
        });

        document.body.appendChild( iframeWrapper );
    }

};

function loadFirstIFrame() {
    loadiframe(iframeQueue[1]);
};

function loadTheRestOfIFrames() {
    loadiframe(iframeQueue[0]);
    for (var i = 2; i < numCacheIFrames; i++) {
        loadiframe(iframeQueue[i]);
    };
}

function installEvents() {

    $('.sw-url-new-window').click( function() {
        window.open(iframeQueue[0].attr('src'));
        return false;
    });

    $('.sw-shuffle-action').click( function() {
        next();
        return false;
    });

     $('.sw-brand').click( function() {
        ignoreBust = true;
        location.reload();
        return false;
    });

    $('.sw-accept').click( function() {

        loadTheRestOfIFrames();
        $('.sw-main').hide();http://localhost:62543/
        $('.sw-slogan').hide();
        $("html").css({"height":"100%"});
        $("html").css({"overflow":"hidden"});

        next();
        
        $('.sw-navbar-items').show();      
        $('.sw-navbar-wrapper').click( function( e ) {
            if( $(e.target).hasClass('sw-navbar') || $(e.target).hasClass('sw-navbar-wrapper') ) {
                next();
                return false;
            }
        });

        $(document).keydown(function(e){
            if (e.keyCode == 39) { 
                next();
                return false;
            }
        });

        return false;
    });

};

$(document).ready(function () {
    installEvents();
    setTimeout( function(){
        initIFrames();
        loadFirstIFrame();
    }, 0);
});

})();