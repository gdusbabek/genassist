var async = require('async');

var echo = require('../../lib/echo');
var rdio = require('../../lib/rdio');
var lastfm = require('../../lib/lastfm');
var Database = require('../../lib/database/index').Database;
var related = require('../../lib/database/related');
var topArtist = require('../../lib/database/topArtist');
var UserDb = require('../../lib/database/context').UserDb;
var settings = require('../../lib/config').settings;
var artistIO = require('../../lib/artist_io');


function resultCallback(req, res, err, results) {
    if (err) {
        res.send(JSON.stringify({status: 'error', result: err}));
    } else {
        res.send(JSON.stringify({status: 'ok', result: results}));
    }
}

// can be done synchronously to return results or async to populate data in the background.
exports.fetchSimilars = function(req, res) {
  var isAsync = req.query.hasOwnProperty('async') && req.query.async.toString() === 'true';
  // artists, user, service
  async.auto({
    get_album_db: Database.getShared.bind(null, related),
    get_artist_db: Database.getShared.bind(null, topArtist),
    get_top_artists: ['get_artist_db', function(callback, results) {
      // returns a list of top artists for a user.
      if (req.query.hasOwnProperty('user')) {
        artistIO.getTopArtists(req.query.user, [req.query.service], results.get_artist_db, callback);
      } else {
        callback(null, []);
      }
    }],
    get_similar_artists: ['get_top_artists', 'get_album_db', function(callback, results) {
      var sourceArtists = results.get_top_artists;
      if (req.query.hasOwnProperty('artists')) {
        req.query.artists.split(',').forEach(function(artist) {
          sourceArtists.push(artist);
        });
      }
      if (sourceArtists.length > 0) {
        artistIO.getAllSimilars(sourceArtists, results.get_album_db, callback);
      } else {
        callback(null, []);
      }
    }]
  }, function(err, results) {
    if (err) {
      if (!isAsync) {
        res.send(JSON.stringify({
          status: 'error',
          result: err,
          message: 'Problem doing things'
        }));
      }
    } else if (isAsync) {
      // return;
    } else {
      res.send(JSON.stringify({
        status: 'ok',
        result: results.get_similar_artists,
        message: 'Here is all the data'
      }));
    }
  });
  if (isAsync) {
    res.send(JSON.stringify({
      status: 'ok',
      result: {},
      message: 'Will process this asynchronous request'
    }));
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

// todo: use client.isLoved.
exports.isSongLoved = function(req, res) {
    var song = req.query.song,
        artist = req.query.artist,
        lastUser = req.query.lastUser;
    async.waterfall([
            function queryLastfm(callback) {
                var client = new lastfm.Client();
                client.execute('track.getInfo', {
                    track: song,
                    artist: artist,
                    username: lastUser
                }, function(err, response) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, response);
                    }
                });
            }
    ], function(err, response) {
        if (err) {
            console.log(err);
            res.send(JSON.stringify({status: 'error', result: null, message: 'Problem with api'}));
        } else if (response.error) {
            console.log(response);
            res.send(JSON.stringify({status: 'error', result: null, message: response.message}));
        } else if (response.track) {
            res.send(JSON.stringify({status: 'ok', result: response.track.userloved == 1, message: 'API OK'}));
        } else {
            console.log(response);
            res.end(JSON.stringify({status: 'error', result: response, message: 'Unexpected response'}));
        }
    });
}

// todo: this method call is too hairy.
exports.currentSong = function(req, res) {
    var curArtistKey = req.query.curArtistKey|| '',
        curSongKey = req.query.curSongKey || '',
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
                            // artist didn't change. no need to fetch images.
                            if (baton.curSongKey === curSongKey) {
                                // song didn't change either. this is easy.
                                callback(null, [], 'dunno');
                            } else if (req.cookies.lastLink) {
                                // need to get loved status of new song.
                                var lastClient = new lastfm.Client();
                                lastClient.isLoved(baton.artist, baton.song, req.cookies.lastUser, function(err, isLoved) {
                                    if (err) {
                                        callback(err);
                                    } else {
                                        callback(null, [], isLoved);
                                    }
                                });
                            } else {
                                callback(null, [], false);
                            }
                        } else {
                            async.parallel([
                                echo.getArtistImages.bind(echo, baton.artist),
                                function getLove(callback) {
                                    if (req.cookies.lastLink) {
                                        var lastClient = new lastfm.Client();
                                        lastClient.isLoved(baton.artist, baton.song, req.cookies.lastUser, callback);
                                    } else {
                                        callback(null, false);
                                    }
                                }
                            ], function(err, resultArr) {
                                if (err) {
                                    callback(err);
                                } else {
                                    callback(null, resultArr[0], resultArr[1])
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
    ], function(err, imgUrls, isLoved) {
        if (err) {
            console.log(err);
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
                    images: imgUrls,
                    isLoved: isLoved
                }
            }));
        }
    });
}

exports.scrobble = function(req, res) {
    async.waterfall([
        function validateParams(callback) {
            if (!req.query.artist) {
                callback(new Error('Missing artist'));
            } else if (!req.query.song) {
                callback(new Error('Missing song'));
            } else if (!req.query.which) {
                callback(new Error('Missing scrobble param'));
            } else {
                callback();
            }
        },
        UserDb.newShared.bind(null),
        function getLastSk(db, callback) {
          db.getLastSk(req.cookies.context, callback);
        },
        function ensureLastsk(lastsk, callback) {
            if (!lastsk || lastsk.length === 0 || !req.cookies.lastLink) {
                callback(new Error('Not linked with Last.fm'));
            } else {
                callback(null, lastsk)
            }
        },
        function doScrobble(lastsk, callback) {
            var client = new lastfm.Client(),
                method = req.query.which === 'love' ? 'track.love' : 'track.unlove';
            client.executePostSigned(method, {
                method: method,
                track: req.query.song,
                artist: req.query.artist,
                api_key: settings.LAST_KEY,
                sk: lastsk
            }, function(err, response) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, response);
                }
            });
        }
    ], function(err, response) {
        if (err) {
            console.log(err);
            res.send(JSON.stringify({status: 'error', result: null, message: 'Problem with api'}));
        } else if (response.error) {
            console.log(response);
            res.send(JSON.stringify({status: 'error', result: null, message: response.message}));
        } else if (response.status && response.status === 'ok') {
            res.send(JSON.stringify({status: 'ok', result: null, message: 'Scrobbled ok'}));
        } else {
            console.log(response);
            res.end(JSON.stringify({status: 'error', result: response, message: 'Unexpected response'}));
        }
    });
}

exports.sandbox = function(req, res) {
  // meh. started.
}