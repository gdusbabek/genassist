/*
cd node_modules/echonest
npm install
rake build
*/

var async = require('async');
var echonest = require('echonest');

var params = {
    api_key: process.env.ECHO_KEY,
    consumer_key: process.env.ECHO_CONSUMER,
    secret: process.env.ECHO_SECRET
};

function dedupeSongs(songs) {
    var newSongs = [];
    var concatSongs = [];
    songs.forEach(function(song) {
        var wholeSong = song.artist + ':' + song.title;
        if (concatSongs.indexOf(wholeSong) < 0) {
            newSongs[newSongs.length] = song;
            concatSongs[concatSongs.length] = wholeSong;
        }
    });
    return newSongs;
}

function scrubSongResults(songs) {
    var newSongs = [];
    songs.forEach(function(song) {
        newSongs[newSongs.length] = {artist: song.artist_name, title: song.title, id: song.id};
    });
    return dedupeSongs(newSongs)    ;
}

exports.search = function(songQuery, callback) {
    var nest = new echonest.Echonest(params);
    nest.song.search({
        format: 'json',
        combined: songQuery,
        results: 5
    }, 
    function songSearchCallback(err, results) {
        if (err) {
            callback(err);
        } else {
            // get the first song. that will be the seed.
            callback(null, scrubSongResults(results.songs));
        }
    });
}

// callbeck(err, songs); // songs is an array of song objects.
exports.seed = function(songId, sinceYear, callback) {
    var nest = new echonest.Echonest(params);
    async.waterfall([
        function createPlaylist(callback) {
            nest.playlist.dynamic.create({
                format: 'json',
                type: 'song-radio',
                variety: 0.75,
                distribution: 'wandering', // focused
                adventurousness: 0.5,
                song_id: songId,
                artist_start_year_after: sinceYear

            },
            function playlistCreateCallback(err, results) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, results.session_id);
                }
            });
        },

        function addSongsToPlaylist(sessionId, callback) {
            var count = 15,
                songs = [];
            async.whilst(
                function conditional() {
                    return songs.length < count;
                },
                function getMore(callback) {
                    nest.playlist.dynamic.next({
                        format: 'json',
                        session_id: sessionId,
                        results: 5,
                        lookahead: 0
                    },
                    function playlistNextCallback(err, results) {
                        if (err) {
                            callback(err);
                        } else {
                            results.songs.forEach(function(song) {
                                songs[songs.length] = song;
                            });
                            callback(null);
                        }
                    });
                },
                function whilstCallback(err) {
                    if (err) {
                        callback(err);
                    } else {
                        // console.log(songs.length);
                        // console.log(songs);
                        callback(null, {sessionId: sessionId, songs: songs});
                    }
                }
            );
        }
    ],
    function waterfallCallback(err, obj) {
        // obj.sessionId, obj.songs
        /*
        { artist_id: 'ARCOSZO1241B9C4043',
        id: 'SOAIGVP1311AFDB93A',
        artist_name: 'O Children',
        title: 'Ruins' },
        */
        callback(null, obj);
    });
}
