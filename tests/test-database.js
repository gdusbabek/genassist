var async = require('async');
var fs = require('fs');

var sqlite3 = require('sqlite3').verbose();

var settings = require('../lib/config').settings;
var Database = require('../lib/database').Database;

var related = require('../lib/database/related');

exports['test_get_shared'] = function(test, assert) {
  Database.getShared(related, function(err, db) {
    assert.ifError(err);
    assert.ok(db);
    assert.ok(db.saveAlbum);
    assert.ok(!db.funkyFunction);
    test.finish();
  });
}

exports['test_db_init'] = function(test, assert) {
  // maybe delete old db file.
  var dbFile = '/tmp/test_db_init.db',
      options = {
        name: 'test_db_init.db',
        migrations: [
          function(db, callback) {
            callback(null);
          }
        ],
        ddl: [
          'create table if not exists meta_desc(version int)',
          'insert into meta_desc(version) values(0)'
        ],
        currentVersion: 0,
        operationalVersion: 0
      };
  async.waterfall([
    function checkExists(callback) {
      fs.exists(dbFile, function(exists) {
        callback(null, exists);
      });
    },
    function maybeDelete(exists, callback) {
      if (exists) {
        fs.unlink(dbFile, callback);
      } else {
        callback(null);
      }
    },
    function createDbInstnace(callback) {
      // creates file as side effect.
      options.db = new sqlite3.Database(dbFile);
      callback(null);
    },
    Database.initDb.bind(null, options),
    fs.unlink.bind(fs, dbFile)
  ], function(err) {
    assert.ifError(err);
    test.finish();
  });
}

exports['test_migrations'] = function(test, assert) {
  var dbFile = '/tmp/test_db_migrations.db',
      options = {
        name: 'test_db_migrations.db',
        migrations: [
          function(db, callback) {},
          function(db, callback) {
            db.run('create table if not exists m1(v int)', callback);
          },
          function(db, callback) {
            db.run('create table if not exists m2(v int)', callback);
          },
          function(db, callback) {
            db.run('create table if not exists m3(v int)', callback);
          },
          function(db, callback) {
            db.run('create table if not exists m4(v int)', callback);
          },
        ],
        ddl: [
          'create table if not exists meta_desc(version int)',
          'insert into meta_desc(version) values (0)'
        ],
        currentVersion: 3,
        operationalVersion: 2,
        db: new sqlite3.Database(dbFile)
      };
  
  async.waterfall([
    Database.initDb.bind(null, options),
    function checkVersion(callback) {
      Database.getVersion(options.db, function(err, version) {
        if (err) {
          callback(err);
        } else {
          assert.strictEqual(options.operationalVersion, version);
          callback(null);
        }
      });
    },
    function checkV4(callback) {
      options.db.get('select * from m2', function(err, res) {
        callback(err);
      });
    },
    function checkV5(callback) {
      options.db.get('select * from m3', function(err, res) {
        if (!err) {
          callback(new Error('m3 should not be there'));
        } else {
          callback(null);
        }
      });
    },
    fs.unlink.bind(fs, dbFile)
  ], function(err) {
    assert.ifError(err);
    test.finish();
  });
}
