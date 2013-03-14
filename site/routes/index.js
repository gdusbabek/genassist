var echo = require('../../lib/echo');

var TWO_YEARS = 1000 * 60 * 60 * 24 * 365 * 2;
var THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

exports.cookies = function(req, res) {
    //console.log(req.headers.cookie);
    // dump the cookie.
    if (req.query.renew) {
        Object.keys(req.cookies).forEach(function(key) {
            // res.cookie('context', util.randomHash(128), {path: '/', maxAge: TWO_YEARS});
            res.cookie(key, req.cookies[key], {path: '/', maxAge: TWO_YEARS});
        });
    }
    res.render('cookies', {
        env: process.env.NODE_ENV || 'none'
    });
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

function maybePrependLeadingZero(s) {
  if (s.toString().length === 1) {
    return '0' + s;
  } else {
    return s;
  }
}

exports.sleeping = function(req, res) {
  // compute a date string from thirty dates ago.
  var dateAgo = new Date(Date.now() - THIRTY_DAYS),
      dateAgoStr = maybePrependLeadingZero(dateAgo.getMonth() + 1) + '/' + maybePrependLeadingZero(dateAgo.getDate()) + '/' + dateAgo.getFullYear();
  res.render('sleeping', {
    rdioUser: req.cookies.hasOwnProperty('rdioUser') ? req.cookies.rdioUser : null,
    lastUser: req.cookies.lastLink ? req.cookies.lastUser : null,
    lastVisit: req.cookies.hasOwnProperty('lastWyws') ? req.cookies.lastWyws : 'Never',
    dateAgoStr: dateAgoStr
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

exports.claimContext = function(req, res) {
    if (req.query.new_context) {
        req.cookies.context = req.query.new_context;
        res.cookie('context', req.query.new_context, {path: '/', maxAge: TWO_YEARS});
    }
    res.redirect('/cookies.html');
}