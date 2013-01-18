var async = require('async');
var sqlite3 = require('sqlite3').verbose();

exports.run = function(db, callback) {
  // ts timestamp default CURRENT_TIMESTAMP
  async.waterfall([
    db.run.bind(db, 'alter table contexts add createdat timestamp default null'),
    db.run.bind(db, 'alter table contexts add accessedat timestamp default null'),
    db.run.bind(db, "update contexts set createdat = strftime('%s','2013-01-01 00:00:01')"),
    db.run.bind(db, "update contexts set accessedat = strftime('%s','2013-01-01 00:00:01')")
  ], callback);
}