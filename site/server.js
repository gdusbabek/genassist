var express = require('express');
var app = express();
var async = require('async');
var rdio = require('./lib/rdio');
var echo = require('./lib/echo');
var util = require('./lib/util');
var settings = require('./config').settings;

app.configure('development', function() {
    if (!process.env.NODE_ENV) {
        process.env.NODE_ENV = 'development';
    }
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    console.log(settings);
});

app.configure('production', function() {
    app.use(express.errorHandler());
    
});

app.configure('staging', function() {
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure(function() {
    console.log('Environment is: ' + process.env.NODE_ENV);
    app.enable('trust proxy')
	app.set('view engine', 'jade');
	app.set('views', __dirname + '/views');
	app.set('view options', {layout: false});
	//app.use(express.bodyParser());
	app.use(express.cookieParser());
	//app.use(app.router);
	app.use(express.static(__dirname + '/public'));

    app.use(function(req, res, next) {
        // see if there is a context cookie
        if (!req.cookies || !req.cookies.context) {
            res.cookie('context', util.randomHash(128), {path: '/', });
        }
        next();
    });
});
	
// routes are here.
var contextDir = settings.CONTEXT_DIR;
var callbackUrl = 'http://' + settings.PROXY_HOST + 
        (settings.PROXY_PORT === 80 ? '' : (':' + settings.PROXY_PORT)) + 
        '/rdio_comeback.html';

app.get('/rdio_register.html', function(req, res) {
    async.waterfall([
        function getRdio(callback) {
            rdio.getAuthRdio({
                callbackUrl: callbackUrl,
                contextId: req.cookies.context,
                contextDir: contextDir // for now.
            }, callback);
        },
        function checkIfLinked(client, callback) {
            if (req.cookies.rdioLink && client.dataStore_.get('accessToken')) {
                // short circuit
                async.waterfall([
                        function testRequest(callback) {
                            client.makeRequest('getPlaylists', function(err, results) {
                                callback(err);
                            });            
                        },
                        function render(callback) {
                            res.render('cookies', {});
                            callback(null);
                        }
                ], callback);
            } else {
                // continue with registration.
                async.waterfall([
                    function beginAuth(callback) {
                        client.beginAuthentication(function(err, loginUrl) {
                            callback(null, client, loginUrl);
                        });
                    },
                    function(client, loginUrl, callback) {
                        rdio.Store.dump(client.dataStore_, contextDir, function(err) {
                            if (err) {
                                callback(err);
                            } else {
                                callback(null, loginUrl);
                            }
                        })
                    },
                    function redirectToRdio(loginUrl, callback) {
                        res.redirect(loginUrl);
                        callback(null);
                    }               
                ], callback);
            }
        }
    ], function(err, loginUrl) {
        if (err) {
            res.render('err', {unknownErr: err});
        }
    });
});

app.get('/rdio_linked.html', function(req, res) {
    res.render('rdio_link', {
       linked: req.cookies.rdioLink ? true : false 
    });
});

var cheatingAuth = new Error('You cannot access that url directly.');

// todo: you need to fix the bug that happens if the user types this in manually. it should not crash the server the way it does now.
app.get('/rdio_comeback.html', function(req, res) {
    // http://genassist.tagfriendly.com/rdio_comeback.html?oauth_verifier=6099&oauth_token=rbzccfjuwptcqcyth3bacmj7
    async.waterfall([
            function getRdio(callback) {
                rdio.getAuthRdio({
                    callbackUrl: callbackUrl,
                    contextId: req.cookies.context,
                    contextDir: contextDir
                }, callback);
            },
            function completeAuth(rdioClient, callback) {
                try {
                    rdioClient.completeAuthentication(req.query.oauth_verifier, function() {
                        // we should be able to get playlists now.
                        callback(null, rdioClient);
                    });
                } catch (err) {
                    
                    callback(cheatingAuth, null);
                }
            },
            function saveData(client, callback) {
                // set the cookie.
                rdio.Store.dump(client.dataStore_, contextDir, function(err) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, client);
                    }
                });
            },
            function testPlaylistFetch(client, callback) {
                client.makeRequest('getPlaylists', function(err, results) {
                    callback(err);
                });
            }
    ], function(err) {
        if (err) {
            if (err === cheatingAuth) {
                res.redirect('/rdio_linked.html');
            } else {
                res.render('error', {unknownErr: err});
            }
        } else {
            res.cookie('rdioLink', true, {path: '/'});
            res.redirect('/rdio_linked.html');
        }
    }); 
});

app.get('/cookies.html', function(req, res) {
    //console.log(req.headers.cookie);
    // dump the cookie.
    res.render('cookies', {});
});

function root(req, res) {
    var params = {
        title: 'Choose One'
    };
	res.render('index', params);
}

app.get('/', root);
app.get('/index.html', root);

app.get('/seed.html', function(req, res) {
    var songId = req.query.songId,
        sinceYear = req.query.sinceYear || '1900',
        songName = req.query.songName || 'Not defined',
        service = req.query.service || 'RDIO';

    echo.seed(songId, sinceYear, service, function(err, results) {
        if (err) {
            res.render('error', {echoError: err});
        } else if (!results) {
            res.render('error', {apiError: 'results were empty.'})
        } else {
            res.render('playlist_builder', {
                sessionId: results.sessionId,
                songName: songName,
                sinceYear: sinceYear,
                songs: results.songs
            });
        }
    });
});

app.get('/candy.html', function(req, res) {
    // this could be busted if there is nothing in the session store        
    res.render('candy', {
        rdioLink: req.cookies.rdioLink
    });
});

function resultCallback(req, res, err, results) {
    if (err) {
        res.send(JSON.stringify({status: 'error', result: err}));
    } else {
        res.send(JSON.stringify({status: 'ok', result: results}));
    }
}

// json method
app.get('/api/steer_session', function(req, res) {
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
});

// json method
app.get('/api/search', function(req, res) {
    var query = decodeURIComponent(req.query.query),
        service = req.query.service;
    
    echo.search(query, resultCallback.bind(null, req, res));
});

// json method
app.get('/api/seed', function(req, res) {
    var songId = req.query.songId,
        sinceYear = req.query.sinceYear || '1900';
    echo.seed(songId, sinceYear, resultCallback.bind(null, req, res));
});

app.get('/api/next_songs_in_session', function(req, res) {
    var sessionId = req.query.sessionId,
        numSongs = req.query.numSongs
    echo.addSongsToPlaylist(sessionId, numSongs, resultCallback.bind(null, req, res));
});

app.get('/api/current_song', function(req, res) {
    var curArtistKey = req.query.curArtistKey|| '',
        baton = {};
    async.waterfall([
        function getRdio(callback) {
            rdio.getAuthRdio({
                callbackUrl: callbackUrl,
                contextId: req.cookies.context,
                contextDir: contextDir
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
});

app.get('/api/save_playlist', function(req, res) {
    var playlistName = req.query.playlistName,
        songs = req.query.songs,
        sessionId = req.query.sessionId;
    
    async.waterfall([
        function getRdio(callback) {
            rdio.getAuthRdio({
                callbackUrl: callbackUrl,
                contextId: req.cookies.context,
                contextDir: contextDir // for now.
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
});

app.listen(settings.APP_PORT, settings.APP_HOST);
console.log('Listening on ' + settings.APP_HOST + ':' + settings.APP_PORT);

module.exports = app;