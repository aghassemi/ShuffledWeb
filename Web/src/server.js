var csv = require('csv')
var http = require('http');
var fs = require('fs');

var urls = [];
var filters = [];

csv()
.from.stream(fs.createReadStream('top-1m.csv'))
.on('record', function(row,index){

    var site = row[1];
    urls.push(site);

})
.on('end', function(count) {
    console.log( urls.length + ' urls loaded' );
});

var port = process.env.PORT || 8080; 

http.createServer(function (req, res) {
    handleRequest(req, res);
}).listen(port);


var handleRequest = function( req, res ) {
    var urlParts = require('url').parse(req.url);
    if (urlParts.pathname.indexOf('/rpc/next') >= 0 ) {
        serveRPC('next', req, res);
    } else if (urlParts.pathname.indexOf('/b')  >= 0 ) {
        serve204( req, res );
    } else {
        notFound(req, res);
    }
};

var serveRPC = function (action, req, res) {
    if (action.toLowerCase() == 'next') {
        res.writeHead(200, { 'Content-Type': 'text/plain' , 'Cache-Control': 'no-cache'  });
        res.end(JSON.stringify( getNextUrls() ) );
    } else {
        notFound(req, res);
    }
};

var notFound = function( req, res ) {
    res.writeHead(404);
    res.end();
};

var serve204 = function (req, res) {
    res.writeHead(204);
    res.end();
};

var getNextUrls = function() {
    var result = [];
    for( var i = 0; i < 100; i++ ) {

        // return a safer site as the first one
        var range = 0.5;
        if( i == 0 ) {
            range = 0.01;
        } 
        var index = Math.floor(Math.random() * range * urls.length);
        result.push( urls[index] );
    }
    return result;
};