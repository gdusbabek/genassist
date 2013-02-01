var fs = require('fs');

var async = require('async');

var util = require('./util');
var settings = require('../lib/config').settings;
var context = require('../lib/database/context');
var Database = require('../lib/database/index').Database;

exports['test_ensure_user'] = function(test, assert) {
  var path = '/tmp/test_ensure_user.db',
      ctxId = 'foo_ctx';
  async.waterfall([
          
    util.unlinkIfExists.bind(null, path),
          
    Database.fromPath.bind(null, path, context),
          
    function ensureUser(db, callback) {
      db.ensureUser(ctxId, function(err) {
        callback(err, db);
      });  
    },
          
    function check(db, callback) {
      db.db.get('select ctxid from contexts where ctxid = ?', [ctxId], function(err, res) {
        assert.ifError(err);
        assert.strictEqual(ctxId, res.ctxid);
        assert.ok(res);
        callback(null);
      });
    },
          
    util.unlinkIfExists.bind(null, path)
    
  ], function(dbErr) {
    assert.ifError(dbErr);
    test.finish();
  });
}