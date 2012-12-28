var express = require('express');
var app = express();
var async = require('async');
var rdio = require('./lib/rdio');
var echo = require('./lib/echo');
var util = require('./lib/util');

app.configure(function() {
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
var contextDir = '/tmp/genassist_contexts';

app.get('/rdio_register.html', function(req, res) {
    async.waterfall([
        function getRdio(callback) {
            rdio.getAuthRdio({
                callbackUrl: 'http://localhost:2000/rdio_comeback.html',
                contextId: req.cookies.context,
                contextDir: contextDir // for now.
            }, callback);
        },
        
        function beginAuth(client, callback) {
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
    ], function(err, loginUrl) {
        if (err) {
            res.render('err', {unknownErr: err});
        }
    });
});

app.get('/rdio_comeback.html', function(req, res) {
    // http://localhost:2000/rdio_comeback.html?oauth_verifier=6099&oauth_token=rbzccfjuwptcqcyth3bacmj7
    async.waterfall([
            function getRdio(callback) {
                rdio.getAuthRdio({
                    callbackUrl: 'http://localhost:2000/rdio_comeback.html',
                    contextId: req.cookies.context,
                    contextDir: contextDir
                }, callback);
            },
            function completeAuth(rdioClient, callback) {
                rdioClient.completeAuthentication(req.query.oauth_verifier, function() {                  
                    // we should be able to get playlists now.
                    callback(null, rdioClient);
                });
            },
            function saveData(client, callback) {
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
            res.render('error', {unknownErr: err});
        } else {
            res.render('cookies', {});
        }
    }); 
});

app.get('/cookies.html', function(req, res) {
    //console.log(req.headers.cookie);
    // dump the cookie.
    res.render('cookies', {});
});

app.get('/index.html', function(req, res) {
    var params = {
        title: 'Choose One'
    };
	res.render('index', params);
});

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
})

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

app.get('/api/save_playlist', function(req, res) {
    var playlistName = req.query.playlistName,
        songIds = req.query.songIds;
    console.log(songIds);
    res.send(JSON.stringify({status: 'ok', result: null, message: 'none'}));
});

app.listen(2000);
console.log('Listening on ' + 2000);

module.exports = app;