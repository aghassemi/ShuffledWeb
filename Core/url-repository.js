var logger = require('winston');
var conf = require('nconf').env().file(__dirname + '\\settings.json').file('test-settings.json');
var azure = require('azure');
var async = require('async');
var shortid = require('shortid').seed(2432);
var util = require('util');

var TABLE = conf.get('URL_TABLE_NAME');
var PARTITION = conf.get('URL_PARTITION_KEY');
var STORAGE_NAME = conf.get("STORAGE_NAME")
var STORAGE_KEY = conf.get("STORAGE_KEY");

var tableService = azure.createTableService(STORAGE_NAME, STORAGE_KEY);
tableService.createTableIfNotExists(TABLE, function (error) {
    if (error) {
        logger.error('Azure table service could not be created' + util.inspect(error));
        throw error;
    } 
});

logger.info('Creating UrlRepository. Table: ' + TABLE  + ' Partition: ' + PARTITION);

var urlRepository = function () { };

urlRepository.prototype.add = function (urls, functionCallback) {
        
    urlEntities = mapUrlToEntities(urls);
    
    async.each(
        urlEntities,
        function insertEntities(url, insertCallback) {
            tableService.insertEntity(TABLE, url, function (error) {
                insertCallback(error);
            });
        },
        function (error) {
            functionCallback(error);
        }
    );

};

urlRepository.prototype.deleteAll = function (functionCallback) {
    var me = this;
    async.waterfall([
        function getAllUrls(callback) {
            me.getAll(function (error, allUrls) {
                callback(error, allUrls);
            });
        },
        function deleteEntities(allUrls, deleteCallback) {
            async.each(
                allUrls,
                function (url, callback) {
                    tableService.deleteEntity(TABLE, url, function (error) {
                        callback(error);
                    });
                },
                function (error) {
                    deleteCallback( error )
                }
            );
        }
    ],
    function (error) {
        if (error) {
            logger.error('Entities could not be deleted. ' + util.inspect(error));
        }

        functionCallback(error);
    });
};

urlRepository.prototype.getAll = function (functionCallback) {
    var query = azure.TableQuery
        .select()
        .from(TABLE)
        .where('PartitionKey eq ?', PARTITION);
         
    tableService.queryEntities(
      query,
      function entitiesQueried(error, entities) {
          if (error) {
              logger.error('Could not query Azure Table Service');
          }

          if (!entities) { entities = []; }
          functionCallback(error, entities);
      });
};

urlRepository.prototype.getRandom = function (count, maxRank) {
    logger.info('Getting random ' + count + ' urls up to rank ' + maxRank);
};

/*
* @private
*/
function mapUrlToEntities(urls) {
    if (!Array.isArray(urls)) {
        urls = [urls];
    }

    urlEntities = urls.map(function (u) {
        return {
            PartitionKey : PARTITION,
            RowKey : shortid.generate(),
            Url: u.Url,
            Rank : u.Rank
        }
    });

    return urlEntities;
};

module.exports = new urlRepository();
