var path = require('path');
var fs = require('fs');

var async = require('async');
var settings = require('../config').settings;

// this script is in charge of loading all existing contexts into the database.

exports.run = function(db, callback) {
    if (settings.CONTEXT_DIR && fs.existsSync(settings.CONTEXT_DIR)) {
        async.waterfall([
            db.run.bind(db, 'delete from contexts'),
            fs.readdir.bind(fs, settings.CONTEXT_DIR),
            function iterateFiles(files, callback) {
                async.forEachSeries(files, function consumeFile(ctxId, callback) {
                    fs.readFile(path.join(settings.CONTEXT_DIR, ctxId), 'utf8', function(err, rdioData) {
                        if (err) {
                            callback(err);
                        } else {
                            // insert that stuff.
                            db.run('insert into contexts values(?,?,?)', [ctxId, rdioData, '{}'], callback);
                        }
                    });
                }, callback);
            }
        ], callback);
    } else {
        callback(null);
    }
}