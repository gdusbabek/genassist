var fs = require('fs');
var path = require('path');

var async = require('async');
var Rdio = require('rdio-node').Rdio;

var params = {
    consumerKey: process.env.RDIO_KEY,
    consumerSecret: process.env.RDIO_SECRET
//    authorizeCallback: 'http://localhost:2000/rdio_comeback.html'
};

function dedupeSongs(songs) {
    var newSongs = [];
    var concatSongs = [];
    songs.forEach(function(song) {
        var wholeSong = song.artist + ':' + song.name;
        if (concatSongs.indexOf(wholeSong) < 0) {
            newSongs[newSongs.length] = song;
            concatSongs[concatSongs.length] = wholeSong;
        }
    });
    return newSongs;
}

// expects?
exports.search = function(q, callback) {
    var rdio = new Rdio(params),
        rdioQuery = {
            query: q,
            types: 'Song'
        }
    rdio.makeRequest('search', rdioQuery, function(err, results) {
        if (err) {
            callback(err, null);
        } else {
            var status = results.status,
                track_count = results.result.track_count,
                number_results = results.result.number_results,
                songs = results.result.results,
                songsBack = [];
            songs.forEach(function(song) {
                songsBack[songsBack.length] = {artist: song.artist, title: song.name};
            });
            songsBack = dedupeSongs(songsBack);
            callback(err, songsBack);
        }
    });
}

function Store(contextId) {
    this.data = {}
    this.contextId = contextId;
}

Store.prototype.get = function(key) {
    return this.data[key];
}

Store.prototype.set = function(key, val) {
    this.data[key] = val;
}

Store.prototype.remove = function(key) {
    delete this.data[key];
}

Store.prototype.removeAll = function() {
    this.data = {};
}

// callback expects(err)
Store.dump = function(store, dir, callback) {
    // todo: handle err & prevent double callback.
    var location = path.join(dir, fileNameFromContextId(store.contextId)),
        stream = fs.createWriteStream(location);
    stream.on('close', callback);
    stream.write(JSON.stringify(store.data), 'utf8');
    stream.end();
}


Store.load = function(contextId, dir, callback) {
    var location = path.join(dir, fileNameFromContextId(contextId)),
        stream = fs.createReadStream(location),
        buf = '',
        store = new Store(contextId);
    stream.setEncoding('utf8');
    stream.on('data', function(data) {
        buf += data;
    });
    stream.on('end', function() {
        store.data = JSON.parse(buf);
        callback(null, store);
    });
}

exports.Store = Store;

function fileNameFromContextId(str) {
    return str.substr(0, Math.min(64, str.length));
}

// options:
//   {String} callbackUrl,
//   {String} contextId,
//   {String} contextDir
// callback expects(err, rdio)
exports.getAuthRdio = function(options, callback) {
    var p = {
        consumerKey: process.env.RDIO_KEY,
        consumerSecret: process.env.RDIO_SECRET,
        authorizeCallback: options.callbackUrl
        //dataStore: new Store(options.contextId)
    };
    async.waterfall([
    function maybeCreate(callback) {
        fs.exists(path.join(options.contextDir, fileNameFromContextId(options.contextId)), function(exists) {
            if (exists) {
                Store.load(options.contextId, options.contextDir, function(err, store) {
                    if (err) {
                        callback(err);
                    } else {
                        p.dataStore = store;
                        callback(null);
                    }
                });
            } else {
                // create it.
                p.dataStore = new Store(options.contextId);
                Store.dump(p.dataStore, options.contextDir, callback);
            }
        });
    },
    function create(callback) {
        var r = new Rdio(p);
        callback(null, r);
    }
    ], callback);
}
