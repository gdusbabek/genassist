var fs = require('fs');
var async = require('async');
var sqlite3 = require('sqlite3').verbose();

var Database = require('../lib/database/index').Database;
var related = require('../lib/database/related');
var dbFile = '/tmp/test_related_db.db';

var ONE_DAY = 1000 * 60 * 60 * 24;
var TWO_DAYS = ONE_DAY * 2;
var THREE_DAYS = ONE_DAY * 3;


// callback(err,RelatedDb);
function makeDb(callback) {
  async.waterfall([
    function checkExists(callback) {
      fs.exists(dbFile, function(exists) {
        callback(null, exists);
      })
    },
    function maybeDelete(exists, callback) {
      if (exists) {
        fs.unlink(dbFile, callback);
      } else {
        callback(null);
      }
    },
    function makeDb(callback) {
      var options = {};
      Object.keys(related.options).forEach(function(key) {
        if (related.options.hasOwnProperty(key)) {
          options[key] = related.options[key];
        }
      });
      options.db = new sqlite3.Database(dbFile);
      callback(null, options);
    },
    function initDb(options, callback) {
      Database.initDb(options, function(err) {
        if (err) {
          callback(err);
        } else {
          callback(null, new related.RelatedDb(options.db));
        }
      });
    }
  ], callback);
}

function tearDownDb(callback) {
  fs.unlink(dbFile, callback);
}

exports['test_construction'] = function(test, assert) {
  async.waterfall([
    makeDb,
    function checkDb(db, callback) {
      assert.ok(db);
      callback(null);
    },
    tearDownDb
  ], function(err) {
    assert.ifError(err);
    test.finish();
  });
}

exports['test_related_insert'] = function(test, assert) {
  var now = Date.now(),
      threeDaysAgo = new Date(now - THREE_DAYS),
      twoDaysAgo = new Date(now - TWO_DAYS),
      oneDayAgo = new Date(now - ONE_DAY);
  async.waterfall([
    makeDb,
    function doSaves(db, callback) {
      async.waterfall([
        db.saveRelated.bind(db, 'ar1', 'al1', 'ar1', threeDaysAgo, threeDaysAgo),
        db.saveRelated.bind(db, 'ar1', 'al1', 'ar2', threeDaysAgo, threeDaysAgo),
        db.saveRelated.bind(db, 'ar1', 'al1', 'ar3', threeDaysAgo, threeDaysAgo),
        db.saveRelated.bind(db, 'ar1', 'al1', 'ar4', threeDaysAgo, threeDaysAgo),
              
        db.saveRelated.bind(db, 'ar2', 'al2', 'ar1', twoDaysAgo, twoDaysAgo),
        db.saveRelated.bind(db, 'ar2', 'al2', 'ar2', twoDaysAgo, twoDaysAgo),
              
        db.saveRelated.bind(db, 'ar3', 'al3', 'ar3', oneDayAgo, oneDayAgo),
        db.saveRelated.bind(db, 'ar3', 'al3', 'ar4', oneDayAgo, oneDayAgo),
              
        db.saveRelated.bind(db, 'ar4', 'al4', 'ar1', new Date(now), new Date(now)),
        db.saveRelated.bind(db, 'ar4', 'al4', 'ar4', new Date(now), new Date(now))
      ], function(err) {
        callback(err, db);
      });
    },
    function checkCount(db, callback) {
      db.db.get('select count(*) from recent_related', [], function(err, res) {
        if (err) {
          callback(err);
        } else {
          assert.strictEqual(10, res['count(*)']);
          callback(null, db);
        }
      });
    },
    function check4days(db, callback) {
      db.getRelated('ar1', 4, function(err, rows) {
        if (err) {
          callback(err);
        } else {
          assert.strictEqual(3, rows.length);
          // should be in reverse order.
          //assert.deepEqual(['ar4', 'ar2', 'ar1'], rows.map(function(obj) { return obj.artist; }));
          callback(null, db);
        }
      });
    },
    function check2days(db, callback) {
      db.getRelated('ar1', 2, function(err, rows) {
        if (err) {
          callback(err);
        } else {
          assert.strictEqual(1, rows.length);
          callback(null);
        }
      });
    },
    tearDownDb
  ], function(err) {
    assert.ifError(err);
    test.finish();
  });
}

exports['test_related_from_path'] = function(test, assert) {
  var path = '/tmp/related_from_path.db';
  async.waterfall([
    function removeIfExists(callback) {
      fs.unlink(path, function(err) {
        callback(null);
      });
    },
    Database.fromPath.bind(null, path, related),
    function(db, callback) {
      assert.ok(db.db.open);
      assert.strictEqual(path, db.db.filename);
      callback(null);
    },
    fs.unlink.bind(null, path)
  ], function(err) {
    assert.ifError(err);
    test.finish();
  });
}
