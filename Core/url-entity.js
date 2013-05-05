var shortid = require('shortid').seed(2432);

var urlEntity = function() {

    this.Id = null,
    this.Url = null,
    this.Rank = null

};

urlEntity.prototype.serializeForAzureTable = function (partition) {
    return {
        PartitionKey : partition,
        RowKey : this.Id,
        Url: this.Url,
        Rank : this.Rank
    };
};

urlEntity.prototype.deserializeFromAzureTable = function (json) {
    this.Id = json.RowKey;
    this.Url = json.Url;
    this.Rank = json.Rank;
};

urlEntity.createNew = function (url, rank) {
    var entity = new urlEntity();
    entity.Id = shortid.generate();
    entity.Url = url;
    entity.Rank = rank;
    return entity;
};

urlEntity.createFromAzureTableJSON = function (json) {
    var entity = new urlEntity();
    entity.deserializeFromAzureTable(json);
    return entity;
};

module.exports = urlEntity;