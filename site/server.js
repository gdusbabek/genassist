var express = require('express');
var app = express();
var rdio = require('./lib/rdio');
var echo = require('./lib/echo');

app.configure(function() {
	app.set('view engine', 'jade');
	app.set('views', __dirname + '/views');
	app.set('view options', {layout: false});
	//app.use(express.bodyParser());
	//app.use(express.cookieParser());
	//app.use(app.router);
	app.use(express.static(__dirname + '/public'));
});
	
// routes are here.

app.get('/rdio_comeback.html', function(req, res) {
    console.log(req);
    // set a cookie with the value here!
    res.render('cookies', {});
}

app.get('/cookies.html', function(req, res) {
    console.log(req.headers.cookie);
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