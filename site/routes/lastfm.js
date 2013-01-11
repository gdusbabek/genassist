var async = require('async');
var lastfm = require('../lib/lastfm');
var settings = require('../config').settings;

var TWO_YEARS = 1000 * 60 * 60 * 24 * 365 * 2;

exports.register = function(req, res) {
    // todo: fix this crappy url.
    res.redirect('http://www.last.fm/api/auth/?api_key=' + settings.LAST_KEY + '&cb=' + encodeURI('http://localhost:2000/lastfm_comeback.html'));
}

// todo: you need to fix the bug that happens if the user types this in manually. it should not crash the server the way it does now.
// see how it was done using cheatingAuth in rdio.comeback.
// todo: also, handle redirec to req.query.return.
exports.comeback = function(req, res) {
    var lastToken = req.query.token,
        client = new lastfm.Client();
    client.execute('auth.getSession', {
        token: lastToken,
        api_sig: lastfm.sign({ api_key: settings.LAST_KEY, token: lastToken, method: 'auth.getSession'})
    }, function(err, response) {
        if (err) {
            res.render('error', {lastfmErr: err});
        } else {
            // set the cookies.
            // response.session.key
            res.cookie('lastLink', true, {path: '/', maxAge: TWO_YEARS});
            res.cookie('lastSk', response.session.key, {path: '/', maxAge: TWO_YEARS});
            res.redirect('/lastfm_linked.html');
        }
    });
}

exports.linked_landing = function(req, res) {
    res.render('lastfm_link', {
        linked: req.cookies.lastLink ? true : false
    });
}