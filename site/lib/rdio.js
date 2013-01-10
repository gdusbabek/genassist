
var settings = require('../config').settings;
var async = require('async');
var Rdio = require('rdio-node').Rdio;
var database = require('../database');

var params = {
    consumerKey: settings.RDIO_KEY,
    consumerSecret: settings.RDIO_SECRET
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
Store.dump = function(store, callback) {
    database.setRdioObject(fileNameFromContextId(store.contextId), store.data, callback);
}


Store.load = function(contextId, callback) {
    var store = new Store(contextId);
    database.getRdioObject(fileNameFromContextId(contextId), function(err, rdioJson) {
        if (err) {
            callback(err);
        } else {
            store.data = JSON.parse(rdioJson);
            callback(null, store);
        }
    });
}

exports.Store = Store;

function fileNameFromContextId(str) {
    return str.substr(0, Math.min(64, str.length));
}

// options:
//   {String} callbackUrl,
//   {String} contextId,
// callback expects(err, rdio)
exports.getAuthRdio = function(options, callback) {
    var p = {
        consumerKey: settings.RDIO_KEY,
        consumerSecret: settings.RDIO_SECRET,
        authorizeCallback: options.callbackUrl
        //dataStore: new Store(options.contextId)
    };
    async.waterfall([
        function loadStore(callback) {
            Store.load(options.contextId, function(err, store) {
                if (err) {
                    callback(err);
                } else {
                    p.dataStore = store;
                    callback(null);
                }
            });
        },
        function create(callback) {
            var r = new Rdio(p);
            callback(null, r);
        }
    ], callback);
}


