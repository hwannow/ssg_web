var mysql = require('mysql2');
var db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'qwer1234',
    database: 'user_info'
});
db.connect();

module.exports = db;