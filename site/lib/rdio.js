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

function Store(data) {
    this.data = data || {}
}

Store.parse = function(strInput) {
    var data = strInput ? JSON.parse(strInput) : null;
    return new Store(data);
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

Store.prototype.stringify = function() {
    return JSON.stringify(this.data);
}

exports.getAuthRdio = function(callbackUrl) {
    var p = {
        consumerKey: process.env.RDIO_KEY,
        consumerSecret: process.env.RDIO_SECRET,
        authorizeCallback: callbackUrl,
        dataStore: new Store()
    },
    r = new Rdio(p);
    return r;
}
