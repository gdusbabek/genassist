var async = require('async');
var sqlite3 = require('sqlite3').verbose();

var sharedDb = new sqlite3.Database(require('./config').settings.DB_PATH);

exports.MAX_VERSION = 6;

function ensureDatabaseExists(db, callback) {
    db.get('select version from dbversion', [], function(err, res) {
        if (err) {
            if (err.errno === 1) {
                async.waterfall([
                    db.run.bind(db, 'create table dbversion (version int)'),
                    db.run.bind(db, 'insert into dbversion values (0)'),
                    db.run.bind(db, 'create table contexts (ctxid varchar(64), rdioObj text, lastObj text)'),
                    // migrations now include:
                    // lastsk varchar(128) default null, 
                    // lastuser varchar(256) default null,
                    // createdat timestamp default null,
                    // accessedat timestamp default null,
                    db.run.bind(db, 'create unique index ctxid_index on contexts(ctxid)')
                ], callback);
            } else {
                callback(err);
            }
        } else {
            callback(null);
        }
    });
}

function migrateDatabase(db, version, callback) {
    var getVersion = function(callback) {
        db.get('select version from dbversion', [], function(err, res) {
            if (err) {
                callback(err);
            } else {
                callback(null, res.version);
            }
        });
    };
    var versionBeforeMigration;
    async.waterfall([
        getVersion, 
        function migrateLoop(oldVersion, callback) {
            versionBeforeMigration = oldVersion;
            var curVersion = oldVersion;
            if (process.env.FORCE_DB_VERSION) {
                curVersion = Math.min(curVersion, version - 1);
            }
            async.whilst(function() {
                return curVersion < version;
            }, 
            function(callback) {
                curVersion += 1;
                console.log('migrating to version ' + curVersion);
                var migration = require('./db_migrations/migration_' + curVersion).run;
                async.waterfall([
                    migration.bind(null, db),
                    db.run.bind(db, 'update dbversion set version = ' + curVersion)
                ], callback);
            }, callback);
        },
        getVersion
    ], function(err, actualVersion) {
        if (err) {
            callback(err);
        } else {
            console.log('Previous database version: ' + versionBeforeMigration);
            console.log('Requested upgrade to version: ' + version);
            console.log('Version after upgrade: ' + actualVersion);
            callback(null);
        }
    });
}

exports.setup = function(dbPath, version, callback) {
    console.log('setting up database at ' + dbPath);
    var db = new sqlite3.Database(dbPath);
    if (process.env.FORCE_DB_VERSION) {
        console.log('Will force DB to version ' + process.env.FORCE_DB_VERSION);
        version = process.env.FORCE_DB_VERSION;
    }
    async.waterfall([
        ensureDatabaseExists.bind(null, db),
        migrateDatabase.bind(null, db, version)
    ], callback);
};

function Database(db) {
  this.db = db;
}

exports.newDbFromPath = function(dbPath) {
  var db = new sqlite3.Database(dbPath);
  return new Database(db);
}

exports.newSharedDb = function() {
  return new Database(sharedDb);    
}

Database.prototype.getVersion = function(callback) {
    this.db.get('select version from dbversion', [], function(err, res) {
        if (err) {
            callback(null, 'unknown');
        } else {
            callback(null, res.version);
        }
    });
}

Database.prototype.getUserCount = function(callback) {
    this.db.get('select count(*) as cnt from contexts', [], function(err, res) {
        if (err) {
            callback(null, 'unknown');
        } else {
            callback(null, res.cnt);
        }
    });
}

// expects err.
Database.prototype.ensureUser = function(ctxId, callback) {
    var self = this;
    self.db.get('select ctxid from contexts where ctxid = ?', [ctxId], function(err, res) {
        if (err) {
            callback(err);
        } else if (!res) {
            // does not exist.
            self.db.run('insert into contexts values(?,?,?,?,?,?,?)', [ctxId, '{}', '{}', null, null, Date.now(), Date.now()], function() {
                callback(null);
            });
        } else {
            // exists.
            callback(null);
        }
    });
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
