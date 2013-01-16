var fs = require('fs');

var settings = require('../config').settings;
var database = require('../database');

exports['test_database_migration'] = function(test, assert) {
  database.setup(function(err) {
    assert.ifError(err);
    fs.unlink(settings.DB_PATH, function(err) {
      if (err) {
        console.log(err);
      }
      test.finish();
    })
  });
}