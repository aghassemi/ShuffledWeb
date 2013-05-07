var logger = require('winston');
var conf = require('nconf').env().file(__dirname + '\\settings.json').file('test-settings.json');
var azure = require('azure');
var async = require('async');
var util = require('util');
var urlEntity = require('./url-entity');

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

urlRepository.prototype.add = function (azureUrlEntities, functionCallback) {
    if (!util.isArray(azureUrlEntities)) {
        azureUrlEntities = [azureUrlEntities];
    }

    async.each(
        azureUrlEntities,
        function insertEntities(url, insertCallback) {
            tableService.insertEntity(TABLE, url.serializeForAzureTable(PARTITION), function (error) {
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
                    tableService.deleteEntity(TABLE, url.serializeForAzureTable( PARTITION ), function (error) {
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
      function entitiesQueried(error, azureTableEntities) {
          if (error) {
              logger.error('Could not query Azure Table Service');
          }

          var entities = [];

          if (azureTableEntities) {
              entities = azureTableEntities.map(function (urlJson) {  return urlEntity.createFromAzureTableJSON(urlJson); });
          }
         
          functionCallback(error, entities);
      });
};

urlRepository.prototype.getRandom = function (count, maxRank) {
    logger.info('Getting random ' + count + ' urls up to rank ' + maxRank);
};

module.exports = new urlRepository();
