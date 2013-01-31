var async = require('async');

// do not ever require settings or use them in here.

function Database(db) {
  this.db = db;
}

Database.getVersion = function(db, callback) {
  db.get('select version from meta_desc', [], function(err, res) {
    if (err) {
      callback(err);
    } else {
      callback(null, res.version);
    }
  });
}

Database.ensureExists = function(options, callback) {
  options.db.get('select version from meta_desc', [], function(err, res) {
    if (err) {
      if (err.errno === 1) {
        // db does not exist. run ddl.
        console.log('Initializing ' + options.name);
        async.waterfall(options.ddl.map(function(sql) {
          return function(callback) {
            console.log(sql);
            options.db.run(sql, callback);
          }
        }), callback);
      } else {
        console.log('unexpected error');
        callback(err);
      }
    } else {
      // db exists.
      console.log('db exists');
      callback(null);
    }
  });  
}

Database.migrate = function(options, callback) {
  var results = {};
  async.waterfall([
    Database.getVersion.bind(null, options.db),
    function migrateLoop(oldVersion, callback) {
      var curVersion = oldVersion;
      results.initialVersion = oldVersion;
      results.requestedVersion = options.operationalVersion;
      async.whilst(function() {
        return curVersion < options.operationalVersion;
      }, function(callback) {
        curVersion += 1;
        try {
          async.waterfall([
            options.migrations[curVersion].bind(null, options.db),
            options.db.run.bind(options.db, 'update meta_desc set version = ' + curVersion)
          ], callback);
        } catch (ex) {
          console.log('busted at ' + curVersion + ',' + options.operationalVersion);
          callback(ex);
        }
      }, callback);
    },
    Database.getVersion.bind(null, options.db)
  ], function(err, actualVersion) {
    results.actualVersion = actualVersion;
    callback(err, results);
  });
}

/**
 * options {
 *   name,
 *   db,
 *   ddl[],
 *   currentVersion,
 *   operationalVersion,
 *   migrations[]
 * }
 * @param options
 * @param callback
 */
Database.initDb = function(options, callback) {
  async.waterfall([
    Database.ensureExists.bind(null, options),
    Database.migrate.bind(null, options)
  ], function(err, migrateResults) {
    if (err) {
      callback(err);
    } else {
      callback(null);
    }
  });
}

exports.Database = Database;


