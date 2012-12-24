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

// callback(err, {sessionId, songs})
function augmentPlaylist(nest, sessionId, count, callback) {
    if (!sessionId) {
        callback(new Error('No session id was supplied'));
        return;
    }
    count = Math.min(25, count);
    var songs =[],
        params = {
            format: 'json',
            session_id: sessionId,
            results: Math.min(5, count),
            lookahead: 0
        }

    async.whilst(
        function conditional() { return songs.length < count; },
        function getMoar(callback) {
            nest.playlist.dynamic.next(params, function playlistNextCallback(err, results) {
                if (err) {
                    console.log(err);
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
                callback(null, {sessionId: sessionId, songs: songs});
            }
        }
    );
            
}

exports.addSongsToPlaylist = function(sessionId, count, callback) {
    augmentPlaylist(new echonest.Echonest(params), sessionId, count, callback);
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
                    console.log('new echo session: ' + results.session_id);
                    callback(null, results.session_id);
                }
            });
        },
        function addSongsToPlaylist(sessionId, callback) {
            augmentPlaylist(nest, sessionId, 5, callback);
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

// callback expects(err, msg)
exports.steer = function(sessionId, songId, direction, callback) {
    var nest = new echonest.Echonest(params),
        params = {
            session_id: sessionId
        };

    if (direction === 'more') {
        params.more_like_this = songId;
    } else if (direction === 'less') {
        params.less_like_this = songId;
    } else {
        callback(new Error('Invalid direction: ' + direction), null);
        return;
    }

    nest.playlist.dynamic.steer(params, function steerCallback(err, results) {
        if (err) {
            callback(err, null);
        } else {
            if (results.status && results.status.code === 0) {
                callback(null, 'Ok');
            } else {
                callback(new Error('Unexpected status: ' + results.status.code), null);
            }
        }
    });
}
