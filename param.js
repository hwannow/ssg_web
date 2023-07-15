var express = require('express');
var router = express.Router();
var url = require('url');

router.get('/', function (request, response) {
    var _url = request.url;
    var queryData = url.parse(_url, true).query;
    response.end(queryData.param);
}); 

module.exports = router