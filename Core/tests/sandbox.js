console.log('--Sanbox Start--');

var repo = require('../url-repository');
var async = require('async');

var urls = [{ Url: 'http://google.com', Rank: 1 }, { Url: 'http://yahoo.com', Rank: 2 }];

async.series([
    function (callback) {
        console.log('deleting');
        repo.deleteAll( function( err ) { callback( err ); } );
    },
    function (callback) {
        console.log('adding');
        repo.add( urls, function( err ) { callback( err ); } );
    },
    function (callback) {
        console.log('getting all');
        repo.getAll( function( err, urlEntities ) {
            console.log(urlEntities);
            callback(err);
        });
    }
], function (err) {
    if (err) {
        console.log("Error " + err);
    }
});
