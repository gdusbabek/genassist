var async = require('async');

var echo = require('../lib/echo');
var rdio = require('../lib/rdio');


function resultCallback(req, res, err, results) {
    if (err) {
        res.send(JSON.stringify({status: 'error', result: err}));
    } else {
        res.send(JSON.stringify({status: 'ok', result: results}));
    }
}

exports.steerSession = function(req, res) {
    var songId = req.query.songId,
        sessionId = req.query.sessionId,
        direction = req.query.direction;
    echo.steer(sessionId, songId, direction, function(err, results) {
        if (err) {
            res.send(JSON.stringify({
                status: 'error',
                result: err,
                message: 'Feedback was not registered.'
            }));
        } else {
            res.send(JSON.stringify({
                status: 'ok',
                result: results,
                message: 'Feedback was received.'
            }));
        }
    });
}

exports.search = function(req, res) {
    var query = decodeURIComponent(req.query.query);
    echo.search(query, resultCallback.bind(null, req, res));
}

exports.seed = function(req, res) {
    var songId = req.query.songId,
        sinceYear = req.query.sinceYear || '1900';
    echo.seed(songId, sinceYear, resultCallback.bind(null, req, res));
}

exports.nextInSession = function(req, res) {
    var sessionId = req.query.sessionId,
        numSongs = req.query.numSongs
    echo.addSongsToPlaylist(sessionId, numSongs, resultCallback.bind(null, req, res));
}

exports.savePlaylist = function(req, res) {
    var playlistName = req.query.playlistName,
        songs = req.query.songs,
        sessionId = req.query.sessionId;
    
    async.waterfall([
        function getRdio(callback) {
            rdio.getAuthRdio({
                //callbackUrl: callbackUrl,
                contextId: req.cookies.context
            }, callback);
        },
        function savePlaylist(client, callback) {
            client.makeRequest('createPlaylist', {
                name: playlistName,
                description: 'Created by Genassist',
                tracks: songs.map(function(obj) { return obj.foreignId}).join(',')
            }, function(err, results) {
                if (err) {
                    callback(err);
                } else if (!results) {
                    callback(new Error('no results'));
                } else if (results.status !== 'ok') {
                    console.log(results);
                    callback(results.status);
                } else {
                    callback(null, results.result);
                }
            });
        },
        function deleteSession(playlist, callback) {
            echo.deleteSession(sessionId, function(err, result) {
                if (err) {
                    console.log('NOT DELETED: ./bin/session_cleanup.js ' + session_id);
                    callback(err);
                } else {
                    callback(null, playlist);
                }
            });
        }
    ], function(err, playlist) {
        if (err) {
            res.send(JSON.stringify({status: 'error', result: null, message: 'something bad happened'}));
        } else {
            res.send(JSON.stringify({
                status: 'ok',
                message: 'Created playlist',
                result: {
                    shortUrl: playlist.shortUrl,
                    icon: playlist.icon
                }
                
            }));
        }
    });
}

exports.currentSong = function(req, res) {
    var curArtistKey = req.query.curArtistKey|| '',
        baton = {};
    async.waterfall([
        function getRdio(callback) {
            rdio.getAuthRdio({
                //callbackUrl: callbackUrl,
                contextId: req.cookies.context
            }, callback);
        },
        function getCurrentSong(client, callback) {
            client.makeRequest('currentUser', {
                extras: 'lastSongPlayed,lastSongPlaytime'
            }, function(err, results) {
                if (err) {
                    callback(err);
                } else {
                    if (results.status === 'ok') {
                        baton.curSongKey = results.result.lastSongPlayed.key;
                        baton.artistKey = results.result.lastSongPlayed.artistKey;
                        baton.artist = results.result.lastSongPlayed.artist;
                        baton.album = results.result.lastSongPlayed.album;
                        baton.song = results.result.lastSongPlayed.name;
                        if(baton.artistKey === curArtistKey) {
                            callback(null, []);     
                        } else {
                            // song changed. need to fetch new images.
                            echo.getArtistImages(baton.artist, function(err, imgUrls) {
                                if (err) {
                                    console.log(err);
                                    callback(err);
                                } else {
                                    callback(null, imgUrls);
                                }
                            });
                        }
                    } else {
                        console.log(results);
                        callback('Unexpected result while getting current song');
                    }
                }
            });
        }
    ], function(err, imgUrls) {
        if (err) {
            res.send(JSON.stringify({status: 'error', result: null, message: 'Problem with api call'}));
        } else {
            res.send(JSON.stringify({
                status: 'ok',
                message: '',
                result: {
                    artistKey: baton.artistKey,
                    songKey: baton.curSongKey,
                    artistName: baton.artist,
                    album: baton.album,
                    song: baton.song,
                    images: imgUrls
                }
            }));
        }
    });
}