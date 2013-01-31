var fs = require('fs');

var async = require('async');

var settings = require('../../lib/config').settings;
var database = require('../database');

exports['test_database_migration'] = function(test, assert) {
  database.setup(settings.DB_PATH, settings.DB_VERSION, function(err) {
    assert.ifError(err);
    fs.unlink(settings.DB_PATH, function(err) {
      if (err) {
        console.log(err);
      }
      test.finish();
    })
  });
}

exports['test_ensure_user'] = function(test, assert) {
  var path = '/tmp/test_ensure_user.db',
      version = database.MAX_VERSION;
  async.waterfall([
          database.setup.bind(null, path, version),
          function ensure(callback) {
            var db = database.newDbFromPath(path);
            db.ensureUser('foo_ctx', callback);
          }
  ], function(dbErr) {
    fs.unlink(path, function(err) {
      // don't really care.
      assert.ifError(dbErr);
      test.finish();
    });
  });
  // setup
  // ensure user no error.
}