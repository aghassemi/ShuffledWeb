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
        window.top.location = location.protocol+'//'+location.hostname + (location.port ? ':'+location.port: ''); '/n/b';
    }
}, 1);