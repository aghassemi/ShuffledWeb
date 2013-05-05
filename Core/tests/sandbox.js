console.log('--Sanbox Start--');

var repo = require('../url-repository');
var urlEntity = require('../url-entity');
var async = require('async');
var importer = require('../alexa-importer');

var urls = [
    urlEntity.createNew("http://google.com", 1),
    urlEntity.createNew("http://yahoo.com", 2)
]

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


importer.import();