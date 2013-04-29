var logger = require('winston');
var conf = require('nconf');
var azure = require('azure');
var async = require('async');
var shortid = require('shortid');
var util = require('util');
shortid.seed( 2432 );

conf.file(__dirname + '\\settings.json').env();

var TABLE = conf.get('URL_TABLE_NAME');
var PARTITION = conf.get('URL_PARTITION_KEY');
var STORAGE_NAME = conf.get("STORAGE_NAME")
var STORAGE_KEY = conf.get("STORAGE_KEY");

var tableService = azure.createTableService(STORAGE_NAME, STORAGE_KEY);
tableService.createTableIfNotExists(TABLE, function (error) {
    if (error) {
        logger.error('Azure table service could not be created' + util.inspect( error ));
    }
});

var urlRepository = function () {

    this.add = function( urls ) {

        if (!Array.isArray(urls)) {
            urls = [urls];
        }

        logger.info('Adding Url' + util.inspect(urls));

        urlEntities = urls.map(function (u) {
            return {
                PartitionKey : PARTITION,
                RowKey : shortid.generate(),
                Url: u.Url,
                Rank : u.Rank
            }
        });

        async.forEach(
            urlEntities,
            function taskIterator(url, callback) {
                tableService.insertEntity(TABLE, url, function (error) {
                    if (!error) {
                        // Entity inserted
                        callback(null);
                    } else {
                        callback(error);
                    }
                });
            },
            function (error) {
                if (!error) {
                    tableService.commitBatch(function (error) {
                        if (error) {
                            logger.error('UrlEntities could not be added. Batch failed');
                        }
                    });
                }
            });
        };

    this.getAll = function(callback) {
        var query = azure.TableQuery
            .select()
            .from(TABLE)
            .where('PartitionKey eq ?', PARTITION);
         
        tableService.queryEntities(
          query,
          function entitiesQueried(err, entities) {
              if (err) {
                  logger.error('Could not query Azure Table Service');
                  callback(err);
              } else {
                  callback(null, entities);
              }
          });
    };

    this.getRandom = function (count, maxRank) {
        logger.info('Getting random ' + count + ' urls up to rank ' + maxRank);
    };
};

module.exports = new urlRepository();