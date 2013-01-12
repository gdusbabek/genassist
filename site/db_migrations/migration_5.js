
var async = require('async');
var sqlite3 = require('sqlite3').verbose();

var settings = require('../config').settings;
var db = new sqlite3.Database(settings.DB_PATH);

exports.run = function(callback) {
    db.run('alter table contexts add lastuser varchar(256) default null', callback);
}