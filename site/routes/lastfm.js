var async = require('async');
var lastfm = require('../lib/lastfm');
var settings = require('../../lib/config').settings;
var UserDb = require('../../lib/database/context').UserDb;

var TWO_YEARS = 1000 * 60 * 60 * 24 * 365 * 2;

var callbackBase = 'http://' + settings.PROXY_HOST +
        (settings.PROXY_PORT === 80 ? '' : (':' + settings.PROXY_PORT));
var callbackUrl = callbackBase + '/lastfm_comeback.html';

exports.register = function(req, res) {
    // todo: maybe append req.query.return.
    var comeback = req.query.return ? (callbackUrl + '?return=' + decodeURIComponent(req.query.return)) : callbackUrl;
    res.redirect('http://www.last.fm/api/auth/?api_key=' + settings.LAST_KEY + '&cb=' + encodeURIComponent(comeback));
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
      res.cookie('lastUser', response.session.name, {path: '/', maxAge: TWO_YEARS});
      UserDb.newShared(function(err, db) {
        if (err) {
          console.log('db error. setting lastsk in cookie');
          res.cookie('lastSk', response.session.key, {path: '/', maxAge: TWO_YEARS});
          // todo: this is duplicated below. that sucks.
          if (req.query.return) {
            res.redirect(req.query.return);
          } else {
            res.redirect('/lastfm_linked.html');
          }
        } else {
          db.setLastSk(req.cookies.context, response.session.key, response.session.name, function(err) {
            if (err) {
              console.log('db error. setting lastsk in cookie');
              res.cookie('lastSk', response.session.key, {path: '/', maxAge: TWO_YEARS});
            }
            if (req.query.return) {
              res.redirect(req.query.return);
            } else {
              res.redirect('/lastfm_linked.html');
            }
          }); 
        }
      });
    }
  });
}

exports.linked_landing = function(req, res) {
    res.render('lastfm_link', {
        linked: req.cookies.lastLink ? true : false
    });
}