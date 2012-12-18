var Rdio = require('rdio-node').Rdio;

var auth = {
    consumerKey: process.env.RDIO_KEY,
    consumerSecret: process.env.RDIO_SECRET
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
    var rdio = new Rdio(auth),
        rdioQuery = {
            query: q,
            types: 'Song'
        };
    rdio.makeRequest('search', rdioQuery, function(err, results) {
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
    });
}

// exports.search('Friday I\'m in Love The Cure', function(err, results) {
//     if (err) {
//         console.log('ouch');
//         process.exit(0);
//     } else {
//         results.forEach(function(song) {
//             console.log(song.artist + ': ' + song.name);
//         });
//         process.exit(0);
//     }
// });