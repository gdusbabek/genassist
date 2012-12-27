var Rdio = require('rdio-node').Rdio;

var params = {
    consumerKey: process.env.RDIO_KEY,
    consumerSecret: process.env.RDIO_SECRET
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
    console.log('GETTT');
    return this.data[key];
}

Store.prototype.set = function(key, val) {
    console.log('SETTTT');
    this.data[key] = val;
}

Store.prototype.remove = function(key) {
    console.log('REMOVEEEEE');
    delete this.data[key];
}

Store.prototype.removeAll = function() {
    this.data = {};
}

Store.prototype.stringify = function() {
    console.log('STRINGIFYYYYY');
    return JSON.stringify(this.data);
}

// var dataStore = new Store();
// params.dataStore = dataStore;
// var r = rdio;

// r.makeRequest('search', {query: 'Archers of Loaf', types: 'Artist'}, function() {
//   console.log(arguments);
// });

// // Make an authenticated request (with OAuth flow)
// r.beginAuthentication(function(error, loginUrl) {
//     if (error) {
//       console.log(error);
//       return;
//     }

//     var stdin = process.stdin, stdout = process.stdout;

//     stdin.resume();
//     stdout.write('visit: ' + loginUrl + '\nEnter your pin: ');

//     stdin.once('data', function(data) {
//       data = data.toString().trim();
//       r.completeAuthentication(data, function() {

//         // Notice how unlike the call to 'search' above,
//         // 'getPlaylists' doesn't need any parameters.
//         r.makeRequest('getPlaylists', function() {
//           console.log(arguments[1]);
//           process.exit();
//         });
//       });
//     });
//   }
// );
