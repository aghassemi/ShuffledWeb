require('date-utils');

var logger = require('winston');
var fs = require('fs');
var async = require('async');
var http = require('http');
var request = require('request');
var admZip = require('adm-zip');
var csv = require('csv');
var events = require('events');
var sys = require('sys');
var repo = require('./url-repository');
var urlEntity = require('./url-entity');

var ALEXA_BASE_FOLDER_PATH = __dirname + "/_alexaFiles/";

var alexaImporter = function() {
    events.EventEmitter.call(this);
    return (this);
};

sys.inherits(alexaImporter, events.EventEmitter);

alexaImporter.prototype.NumberOfSites = {
    N10: 10,
    N100: 100,
    N1K: 1000,
    N5K: 5000,
    N10K: 10000,
    N100K: 100000,
    N200K: 200000,
    N300K: 300000,
    N500K: 500000,
    MAX: 1000000
};

alexaImporter.prototype.import = function( numSites, functionCallback ) {
    
    var me = this;

    getTopSitesCSV(function (error, csvContent) {

        var numImported = 0;
        if (!error) {
            csv()
            .from(csvContent)
            .transform(function (row, index) {
                if (index <= numSites) {
                    var record = urlEntity.createNew(row[1], row[0]);
                    repo.add(record, function (addError) {
                        if (!addError) {
                            me.emit('record', ++numImported);
                        } else {
                            functionCallback(addError);
                        }

                        if (numImported == numSites) {
                            me.emit('end', numImported);
                        }
                    });  
                }
            })
        } else {
            functionCallback(error);
        }

    });
};

function getTopSitesCSV ( functionCallback ) {

    async.waterfall([
        downloadTopSitesIfNeeded,
        readCurrentTopSitesCSVFile
    ],
    function (error, csv) {
        if (error) {
            logger.error('getTopSitesCSV failed:  ' + util.inspect(error));
        }

        functionCallback(error, csv);
    });
    
};

function downloadTopSitesIfNeeded(functionCallback) {

    if (todaysTopSitesFileExistSync()) {
        functionCallback(null);
        return;
    }

    var req = request(
        {
            method: 'GET',
            uri: 'http://s3.amazonaws.com/alexa-static/top-1m.csv.zip'
        }
    );

    out = fs.createWriteStream(getCurrentTopSitesZipFilePathSync());

    req.pipe(out);
    out.on('close', function () {
        var zip = new admZip(getCurrentTopSitesZipFilePathSync()),
        zipEntries = zip.getEntries();
        zip.extractAllTo(ALEXA_BASE_FOLDER_PATH, true);
        functionCallback(null);
    });

    out.on('error', function ( err ) {
        functionCallback(err);
    });

};

function readCurrentTopSitesCSVFile(functionCallback) {
    var csvFilePath = getCurrentTopSitesCSVFilePathSync();
    fs.readFile(csvFilePath, 'utf8', function (err, csv) {
        functionCallback(err, csv);
    });
};

function todaysTopSitesFileExistSync() {
    var filePath = getCurrentTopSitesZipFilePathSync();
    return fs.existsSync(filePath)
};

function getCurrentTopSitesCSVFilePathSync() {
    return ALEXA_BASE_FOLDER_PATH + 'top-1m.csv';
};

function getCurrentTopSitesZipFilePathSync() {
    return ALEXA_BASE_FOLDER_PATH + 'alexa-' + Date.today().toYMD() + '.zip';
};

module.exports = new alexaImporter();