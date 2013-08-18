var ignoreBust = false;
(function(){

'use strict';

var prevent_bust = 0
window.top.onbeforeunload = function () {
    for( var i = 0; i < 10000; i++ ){
        document.createElement('div');
    }
    prevent_bust++;
};

setInterval(function () {
    if (prevent_bust > 0) {
        prevent_bust -= 2

        if( !ignoreBust ) { 
        	var currentHost = location.protocol+'//'+location.hostname + (location.port ? ':'+location.port: '');
        	window.top.location = currentHost + '/n/b';
        }
    }
}, 1);

})();