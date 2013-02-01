var util = require('util');

var async = require('async');

var settings = require('../config').settings;
var Database = require('./index').Database;

var CURRENT_VERSION = 0;
var OPERATIONAL_VERSION = settings.CONTEXT_DB_VERSION;
var MIGRATIONS = [
  function migration0(db, callback) { callback(null); }
];

var sqlite3 = require('sqlite3').verbose();
var db;
try {
  db = new sqlite3.Database(settings.CONTEXT_DB_PATH);
} catch (typeerror) {
  // dang! don't use the defaults!
}

var DDL = [
  'create table if not exists meta_desc(version int)',
  'create table contexts (ctxid varchar(64), ' + 
                         'rdioObj text, ' + 
                         'lastObj text, ' + 
                         'lastsk varchar(128) default null, ' + 
                         'lastuser varchar(256) default null, ' + 
                         'createdat timestamp default null, ' + 
                         'accessedat timestamp default null)',
  'create unique index ctxid_index on contexts(ctxid)',
  'insert into meta_desc(version) values(' + CURRENT_VERSION + ')'
];

exports.options = {
  name: 'user_contexts',
  migrations: MIGRATIONS,
  ddl: DDL,
  currentVersion: CURRENT_VERSION,
  operationalVersion: OPERATIONAL_VERSION,
  db: db
};

var sharedDb = null;

function UserDb(db) {
  Database.call(this);
  this.db = db;
}
util.inherits(UserDb, Database);

UserDb.prototype.getUserCount = function(callback) {
  this.db.get('select count(*) as cnt from contexts', [], function(err, res) {
    if (err) {
      callback(null, 'unknown');
    } else {
      callback(null, res.cnt);
    }
  });
}

UserDb.prototype.ensureUser = function(ctxId, callback) {
  var self = this;
  self.db.get('select ctxid from contexts where ctxid = ?', [ctxId], function (err, res) {
    if (err) {
      callback(err);
    }
    else if (!res) {
      // does not exist.
      self.db.run('insert into contexts values(?,?,?,?,?,?,?)', [ctxId, '{}', '{}', null, null, Date.now(), Date.now()], function () {
        callback(null);
      });
    }
    else {
      // exists.
      callback(null);
    }
  });
};

// todo: get rid of this.
UserDb.prototype.getVersion = function(callback) {
  Database.getVersion.call(Database, this.db, callback)
}

// callback expects(err, rdioObject)
Database.prototype.getRdioObject = function(ctxId, callback) {
  var self = this;
  async.waterfall([
    self.ensureUser.bind(self, ctxId),
    function getField(callback) {
      self.db.get('select rdioObj from contexts where ctxid = ?', [ctxId], function(err, result) {
        if (err) {
          callback(err, null);
        } else {
          callback(null, result.rdioObj); // remember, it is a string.
        }
      });
    }
  ], callback);
}

// callback expects(err).
Database.prototype.setRdioObject = function(ctxId, rdioObject, callback) {
  this.db.run('update contexts set rdioObj = ? where ctxid = ?', [JSON.stringify(rdioObject), ctxId], callback);
}

// expects (err, sk)
Database.prototype.getLastSk = function(ctxId, callback) {
  this.db.get('select lastsk from contexts where ctxid = ?', [ctxId], function(err, result) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, result.lastsk);
    }
  });
}

// expects(err)
Database.prototype.setLastSk = function(ctxId, sk, user, callback) {
  this.db.run('update contexts set lastsk = ?, lastuser = ? where ctxid = ?', [sk, user, ctxId], callback);
}

// expects(err, UserDb)
UserDb.newShared = function(callback) {
  if (sharedDb) {
    callback(null, new UserDb(sharedDb));
  } else {
    Database.fromPath(settings.CONTEXT_DB_PATH, exports, function(err, userDb) {
      if (db) {
        sharedDb = userDb.db;
      }
      callback(err, new UserDb(sharedDb));
    });
  }
}

exports.UserDb = UserDb;
exports.Constructor = UserDb;