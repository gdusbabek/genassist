var fs = require('fs');

var async = require('async');

var util = require('./util');
var settings = require('../lib/config').settings;
var topArtist = require('../lib/database/topArtist');
var Database = require('../lib/database/index').Database;

exports['test_from_file'] = function(test, assert) {
  var path = '/tmp/test_artistdb_from_file.db';
  async.waterfall([
          
    util.unlinkIfExists.bind(null, path),
          
    Database.fromPath.bind(null, path, topArtist),
          
    function check(db, callback) {
      db.db.get('select version from meta_desc', [], function(err, res) {
        assert.ifError(err);
        assert.ok(res);
        // for my sanity
        assert.strictEqual(0, res.version);
        assert.strictEqual(topArtist.options.currentVersion, res.version);
        callback(null, db);
      });
    },
    
    function insertit(db, callback) {
      db.setTopArtists('gd', 'gd', ['gd', 'fd', 'md'], Date.now(), function(err) {
        callback(err, db);
      });
    },
    
    function getit(db, callback) {
      db.getTopArtists('gd', 'gd', function(err, lastPollTs, artists) {
        assert.ifError(err);
        assert.strictEqual(artists.length, 3);
        callback(null);
      });
    },
          
    util.unlinkIfExists.bind(null, path)
    
  ], function(dbErr) {
    assert.ifError(dbErr);
    test.finish();
  });
}
