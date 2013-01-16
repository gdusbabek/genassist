var async = require('async');
var sqlite3 = require('sqlite3').verbose();

var settings = require('./config').settings;

var db = new sqlite3.Database(settings.DB_PATH);

function ensureDatabaseExists(callback) {
    db.get('select version from dbversion', [], function(err, res) {
        if (err) {
            if (err.errno === 1) {
                async.waterfall([
                    db.run.bind(db, 'create table dbversion (version int)'),
                    db.run.bind(db, 'insert into dbversion values (0)'),
                    db.run.bind(db, 'create table contexts (ctxid varchar(64), rdioObj text, lastObj text)'),
                    // migrations now include:
                    // lastsk varchar(128) default null, lastuser varchar(256) default null
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

function applyMigration(versionId, callback) {
    async.waterfall([
            db.run.bind(db, 'alter table contexts add foo' + versionId + ' int default 0'),
            db.run.bind(db, 'update dbversion set version = ' + versionId)
    ], callback);
}

function migrateDatabase(version, callback) {
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
                    migration,
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

exports.setup = function(callback) {
    console.log('setting up database at ' + settings.DB_PATH);
    var upgradeVersion = settings.DB_VERSION;
    if (process.env.FORCE_DB_VERSION) {
        console.log('Will force DB to version ' + process.env.FORCE_DB_VERSION);
        upgradeVersion = process.env.FORCE_DB_VERSION;
    }
    async.waterfall([
        ensureDatabaseExists,
        migrateDatabase.bind(null, upgradeVersion)
    ], callback);
};

exports.getVersion = function(callback) {
    db.get('select version from dbversion', [], function(err, res) {
        if (err) {
            callback(null, 'unknown');
        } else {
            callback(null, res.version);
        }
    });
}

exports.getUserCount = function(callback) {
    db.get('select count(*) as cnt from contexts', [], function(err, res) {
        if (err) {
            callback(null, 'unknown');
        } else {
            callback(null, res.cnt);
        }
    });
}

// expects err.
exports.ensureUser = function(ctxId, callback) {
    db.get('select ctxid from contexts where ctxid = ?', [ctxId], function(err, res) {
        if (err) {
            callback(err);
        } else if (!res) {
            // does not exist.
            db.run('insert into contexts values(?,?,?,?,?)', [ctxId, '{}', '{}', null, null], function() {
                callback(null);
            });
        } else {
            // exists.
            callback(null);
        }
    });
}

// callback expects(err, rdioObject)
exports.getRdioObject = function(ctxId, callback) {
    async.waterfall([
        exports.ensureUser.bind(null, ctxId),
        function getField(callback) {
            db.get('select rdioObj from contexts where ctxid = ?', [ctxId], function(err, result) {
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
exports.setRdioObject = function(ctxId, rdioObject, callback) {
    db.run('update contexts set rdioObj = ? where ctxid = ?', [JSON.stringify(rdioObject), ctxId], callback);
}

// expects (err, sk)
exports.getLastSk = function(ctxId, callback) {
    db.get('select lastsk from contexts where ctxid = ?', [ctxId], function(err, result) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, result.lastsk);
        }
    });
}

// expects(err)
exports.setLastSk = function(ctxId, sk, user, callback) {
    db.run('update contexts set lastsk = ?, lastuser = ? where ctxid = ?', [sk, user, ctxId], callback);
}