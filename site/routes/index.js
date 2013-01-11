var echo = require('../lib/echo');

var TWO_YEARS = 1000 * 60 * 60 * 24 * 365 * 2;

exports.cookies = function(req, res) {
    //console.log(req.headers.cookie);
    // dump the cookie.
    if (req.query.renew) {
        Object.keys(req.cookies).forEach(function(key) {
            // res.cookie('context', util.randomHash(128), {path: '/', maxAge: TWO_YEARS});
            res.cookie(key, req.cookies[key], {path: '/', maxAge: TWO_YEARS});
        });
    }
    res.render('cookies', {});
}

exports.root = function(req, res) {
    var params = {
        title: 'Genassist'
    };
    res.render('index', params);
}

exports.candy = function(req, res) {
    // this could be busted if there is nothing in the session store        
    res.render('candy', {
        rdioLink: req.cookies.rdioLink,
        lastLink: req.cookies.lastLink
    });
}

exports.seed = function(req, res) {
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
}