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
                    db.run.bind(db, 'create index ctxid_index on contexts(ctxid)')
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
    async.waterfall([
        ensureDatabaseExists,
        migrateDatabase.bind(null, settings.DB_VERSION)
    ], callback);
};