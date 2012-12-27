var fs = require('fs');
var path = require('path');

var Rdio = require('rdio-node').Rdio;

var params = {
    consumerKey: process.env.RDIO_KEY,
    consumerSecret: process.env.RDIO_SECRET,
    authorizeCallback: 'http://localhost:2000/rdio_comeback.html'
};

var rdio = new Rdio(params);

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
    var rdioQuery = {
            query: q,
            types: 'Song'
        };
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

function Store(contextKey) {
    this.data = {}
    this.contextKey = contextKey;
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

Store.dump = function(store, dir) {
    var buf = JSON.stringify(store.data);
    fs.writeFileSync(path.join(dir, store.contextKey), buf, 'utf8');
}

Store.load = function(contextKey, dir) {
    var fd = path.join(dir, contextKey),
        buf = fs.readFileSync(fd, 'utf8'),
        store = new Store(contextKey);
    store.data = JSON.parse(buf);
    return store;
}

exports.Store = Store;

// options:
//   {String} callbackUrl,
//   {String} contextId
exports.getAuthRdio = function(options) {
    var p = {
        consumerKey: process.env.RDIO_KEY,
        consumerSecret: process.env.RDIO_SECRET,
        authorizeCallback: options.callbackUrl,
        dataStore: new Store(options.contextId)
    },
    r = new Rdio(p);
    return r;
}
