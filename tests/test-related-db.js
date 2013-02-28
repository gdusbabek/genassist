var fs = require('fs');
var async = require('async');
var sqlite3 = require('sqlite3').verbose();

var Database = require('../lib/database/index').Database;
var related = require('../lib/database/related');
var util = require('./util');
var dbFile = '/tmp/test_related_db.db';

var ONE_DAY = 1000 * 60 * 60 * 24;
var TWO_DAYS = ONE_DAY * 2;
var THREE_DAYS = ONE_DAY * 3;

// todo: move to common.
function finisher(test, assert) {
  return function(err) {
    assert.ifError(err);
    test.finish();
  }
}

function dbFromFile(file, callback) {
  var options = {};
  Object.keys(related.options).forEach(function(key) {
    if (related.options.hasOwnProperty(key)) {
      options[key] = related.options[key];
    }
  });
  options.db = new sqlite3.Database(file);
  callback(null, options);
}


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
    dbFromFile.bind(null, dbFile),
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
  ], finisher(test, assert));
}

exports['test_v0_v1_migration'] = function(test, assert) {
  var src = 'tests/data/related_v0.db',
      dst = '/tmp/related_v0.db';
  
  async.waterfall([
    util.unlinkIfExists.bind(null, dst),
    function copyFile(callback) {
      util.copyFile(src, dst);
      callback(null);
    },
    Database.fromPath.bind(null, dst, related),
    function testUpgradedDb(options, callback) {
      options.db.get('select distinct discovered as discovered from albums', [], function(err, res) {
        assert.ifError(err);
        assert.ok(res);
        assert.strictEqual(res.discovered, 0);
        //callback(null);
        options.db.close(callback);
      });
    },
    Database.fromPath.bind(null, dst, related),
    function close(options, callback) {
      options.db.close(callback);
    },
    util.unlinkIfExists.bind(null, dst)
  ], finisher(test, assert));
}

//NODE_PATH=lib NODE_ENV=testing GENASSIST_CONFIG_DIR=/Users/gdusbabek/codes/github/genassist/tests ./node_modules/.bin/whiskey tests.test-related-db.test_v0_v1_migration --real-time --report-timing --failfast --timeout 100000 --sequential
