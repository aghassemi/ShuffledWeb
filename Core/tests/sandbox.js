console.log('--Sanbox Start--');

var repo = require('../url-repository');

//repo.add({ Url: 'http://google.com', Rank: 1 });
repo.getAll(function ( error, entities) {
    console.log(entities);
});