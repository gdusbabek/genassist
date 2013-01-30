var fs = require('fs');
var path = require('path');

var async = require('async');
var sqlite3 = require('sqlite3');

var related = require('../lib/database/related');
var FakeRdio = require('./fake-rdio').FakeRdio;
var albumIO = require('../lib/album_io');

var dbFile = '/tmp/test_album_load.db';
var db;

var ORDERED_PULLS = [
  'tests/data/album_1359259761642.json',
  'tests/data/album_1359344226321.json',
  'tests/data/album_1359374231397.json'
];

// create a new database.
exports['setUp'] = function(test, assert) {
  async.waterfall([
    function removeIfExists(callback) {
      fs.unlink(dbFile, function(err) {
        callback(null);
      });
    },
    related.fromPath.bind(null, dbFile),
    function(db, callback) {
      assert.ok(db.db.open);
      assert.strictEqual(dbFile, db.db.filename);
      callback(null, db);
    }
  ], function(err, _db) {
    assert.ifError(err);
    db = _db;
    test.finish();
  });
};

// remove the database.
exports['tearDown'] = function(test, assert) {
  fs.unlink(dbFile, function(err) {
    assert.ifError(err);
    test.finish();
  });
}

// ensure that FakeRdio client isn't busted.
exports['test_fake_rdio'] = function(test, assert) {
  var rdio = new FakeRdio();
  rdio.set('currentReleaseFile', 'tests/data/album_1359259761642.json');
  albumIO.setRdioUnsafe(rdio);
  albumIO.collectNewAlbums(function(err, albumObjArr) {
    assert.strictEqual(4487, albumObjArr.length);
    albumIO.setRdioUnsafe(null);
    test.finish();
  });
}

// get albums from rdio, save them to the database.
exports['test_collect_new_albums'] = function(test, assert) {
  var rdio = new FakeRdio(),
      dataFile = ORDERED_PULLS[0]; // represents a single pull from rdio.
    
  
  rdio.set('currentReleaseFile', dataFile);
  albumIO.setRdioUnsafe(rdio);
  
  async.waterfall([
    albumIO.collectNewAlbums.bind(null),
    function saveThem(albums, callback) {
      assert.ok(albums.length > 0);
      albumIO.saveAlbumsDatabase(albums, db, function(err, count) {
        assert.ifError(err);
        assert.strictEqual(albums.length, count);
        callback(null);
      });
    },
    function checkOnDb(callback) {
      db.getAlbumCount(function(err, count) {
        assert.ifError(err);
        assert.ok(count > 0);
        callback(null);
      })
    }
  ], function(err) {
    assert.ifError(err);
    test.finish();
  });
}

exports['test_save_and_load_locally'] = function(test, assert) {
  var savePath = '/tmp/test_save_load_locally.json',
      albumArr = [],
      push = function(obj, callback) {
        albumArr.push(obj);
        callback(null, obj);
      };
  async.waterfall([
    albumIO.loadAlbumsFromPath.bind(null, ORDERED_PULLS[0]),
    push,
    albumIO.saveAlbumsLocally.bind(null, savePath),
    albumIO.loadAlbumsFromPath.bind(null, savePath),
    push
  ], function(err) {
    assert.deepEqual(albumArr[0], albumArr[1]);
    assert.strictEqual(4487, albumArr[0].length);
    assert.ifError(err);
    test.finish();
  });
}

// next, write a test to see if we can diff two jsons and then load just those files. look at gary.js to see this working.
exports['test_new_album_extraction'] = function(test, assert) {
  async.parallel([
    albumIO.extractNewAlbums.bind(null, ORDERED_PULLS[0], ORDERED_PULLS[1]),
    albumIO.extractNewAlbums.bind(null, ORDERED_PULLS[1], ORDERED_PULLS[2]),
    albumIO.extractNewAlbums.bind(null, ORDERED_PULLS[0], ORDERED_PULLS[2]),
  ], 
  function(err, results) {
    assert.ifError(err);
    assert.strictEqual(263, results[0].length);
    assert.strictEqual(660, results[1].length);
    assert.strictEqual(917, results[2].length);
    test.finish();
  });
}
