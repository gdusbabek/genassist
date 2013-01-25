var fs = require('fs');
var async = require('async');
var sqlite3 = require('sqlite3').verbose();

var Database = require('../lib/database/index').Database;
var related = require('../lib/database/related');
var dbFile = '/tmp/test_related_db.db';

var ONE_DAY = 1000 * 60 * 60 * 24;
var TWO_DAYS = ONE_DAY * 2;
var THREE_DAYS = ONE_DAY * 3;
var FOUR_DAYS = ONE_DAY * 4;

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

exports['test_insert'] = function(test, assert) {
  var now = Date.now();
  async.waterfall([
      makeDb,
      function doSaves(db, callback) {
        async.waterfall([
          db.saveRelated.bind(db, 'ar1', 'al1', new Date(now - THREE_DAYS), 'ar1'),
          db.saveRelated.bind(db, 'ar1', 'al1', new Date(now - THREE_DAYS), 'ar2'),
          db.saveRelated.bind(db, 'ar1', 'al1', new Date(now - THREE_DAYS), 'ar3'),
          db.saveRelated.bind(db, 'ar1', 'al1', new Date(now - THREE_DAYS), 'ar4'),
                
          db.saveRelated.bind(db, 'ar2', 'al2', new Date(now - TWO_DAYS), 'ar1'),
          db.saveRelated.bind(db, 'ar2', 'al2', new Date(now - TWO_DAYS), 'ar2'),
                
          db.saveRelated.bind(db, 'ar3', 'al3', new Date(now - ONE_DAY), 'ar3'),
          db.saveRelated.bind(db, 'ar3', 'al3', new Date(now - ONE_DAY), 'ar4'),
                
          db.saveRelated.bind(db, 'ar4', 'al4', new Date(now), 'ar1'),
          db.saveRelated.bind(db, 'ar4', 'al4', new Date(now), 'ar4')
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

