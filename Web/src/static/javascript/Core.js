(function(){

'use strict';

var curUrls = [];
var curIndex = 0;
var wait = false;
var iframeQueue = [];

var waitQueue = [];
var urlSpan;

var numCacheIFrames = 4;

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
            curIndex++;
        }, 10);

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
    $('.sw-url').val( iframeQueue[0].attr('src') );
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

function startEngine() {

    $('.sw-url').val( location.href );
    $('.sw-navbar-items').show();

    for( var i = 0; i < numCacheIFrames; i++ ) {
        var iframeWrapper = document.createElement('div');
        iframeWrapper.className = 'sw-iframe-wrapper sw-hidden';

        var iframeObj = $('<iframe class="sw-iframe" src="about:blank" allowTransparency="false"></iframe>');
        iframeObj.appendTo( iframeWrapper );

        iframeQueue.push(iframeObj);
        if (i > 0) {
            loadiframe(iframeObj);
        }
        iframeObj.load(function () {
            if (iframeObj[0].src != 'about:blank') {
                $(document.body).removeClass('sw-loading');
            }
        });

        document.body.appendChild( iframeWrapper );
    }

};

function installEvents() {

    $('.sw-url-new-window').click( function() {
        window.open(iframeQueue[0].attr('src'));
        return false;
    });

    $('.sw-shuffle-action').click( function() {
        next();
        return false;
    });

    $('.sw-accept').click( function() {
        startEngine();
        $('.sw-main').hide();
        next();
        return false;
    });

};

$(document).ready(function () {
    installEvents();
});

})();