var async = require('async');

var echo = require('../../lib/echo');
var related = require('../../lib/database/related');
var topArtist = require('../../lib/database/topArtist');
var Database = require('../../lib/database/index').Database;
var artistIO = require('../../lib/artist_io');
var albumIO = require('../../lib/album_io');

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

function tsToDateString(ts) {
  var date = new Date(ts);
  return maybePrependLeadingZero(date.getMonth() + 1) + '/' + maybePrependLeadingZero(date.getDate()) + '/' + date.getFullYear()
}

exports.sleeping = function(req, res) {
  // compute a date string from thirty dates ago.
  var dateAgoStr = tsToDateString(Date.now() - THIRTY_DAYS);
  res.render('sleeping', {
    rdioUser: req.cookies.hasOwnProperty('rdioUser') ? req.cookies.rdioUser : null,
    lastUser: req.cookies.lastLink ? req.cookies.lastUser : null,
    lastVisit: req.cookies.hasOwnProperty('lastWyws') ? tsToDateString(parseInt(req.cookies.lastWyws, 10)) : 'Never',
    lastVisitMillis: req.cookies.hasOwnProperty('lastWyws') ? parseInt(req.cookies.lastWyws, 10) : 0,
    dateAgoStr: dateAgoStr
  });
}

exports.sleepingResults = function(req, res) {
  
  async.auto({
    get_album_db: Database.getShared.bind(null, related),
    get_artist_db: Database.getShared.bind(null, topArtist),
    get_top_rdio_artists: ['get_artist_db', function(callback, results) {
      if (req.query.hasOwnProperty('rdioUser')) {
        artistIO.getTopArtists(req.query.rdioUser, ['rdio'], results.get_artist_db, callback);
      } else {
        callback(null, []);
      }
    }],
    get_top_lastfm_artists: ['get_artist_db', function(callback, results) {
      if (req.query.hasOwnProperty('lastfmUser')) {
        artistIO.getTopArtists(req.query.lastfmUser, ['lastfm'], results.get_artist_db, callback);
      } else {
        callback(null, []);
      }
    }],
    build_artists: ['get_top_rdio_artists', 'get_top_lastfm_artists', function(callback, results) {
      var allArtists = [];
      [results.get_top_lastfm_artists, results.get_top_rdio_artists].forEach(function(arr) {
        if (arr) {
          arr.forEach(function(artist) {
            if (allArtists.indexOf(artist) < 0) {
              allArtists.push(artist);
            }
          });
        }
      });
      if (req.query.hasOwnProperty('artists')) {
        req.query.artists.split(',').forEach(function(artist) {
          if (allArtists.indexOf(artist) < 0) {
            allArtists.push(artist);
          }
        });
      }
      callback(null, allArtists);
    }],
    get_similar_artists: ['build_artists', 'get_album_db', function(callback, results) {
      if (results.build_artists.length === 0) {
        callback(null, []);
      } else {
        // this returns a hash of {artist: [related artists], artist: [related artists]}
        artistIO.getAllSimilars(results.build_artists, results.get_album_db, callback);
      }
    }],
    'invert_similar_artists': ['get_similar_artists', function(callback, results) {
      var sims = {};
      Object.keys(results.get_similar_artists).forEach(function(artist) {
        if (!sims[artist]) {
          sims[artist] = [];
        }
        sims[artist].push(artist);
        results.get_similar_artists[artist].forEach(function(match) {
          if (!sims[match]) {
            sims[match] = [];
          }
          sims[match].push(artist);
        });
      });
      callback(null, sims); // Object.keys(sims) is whose albums you want to look for.
    }],
    'get_new_releases': ['invert_similar_artists', 'get_album_db', function(callback, results) {
      var newAlbums = {};
      results.get_album_db.getAlbumsByArtistsSince(Object.keys(results.invert_similar_artists), parseInt(req.query.millis, 10), function(err, rows) {
        if (err) { callback(err); return; }
        rows.forEach(function(album) {
          if (!newAlbums.hasOwnProperty(album.artist)) {
            newAlbums[album.artist] = [];
          }
          album.similarToArtists = results.invert_similar_artists[album.artist];
          newAlbums[album.artist].push(album);
        });
        callback(null, newAlbums); // hash of {artist: [list of album objects], artist: [list of album objects]}
      });
    }],
    'flatten_albums': ['get_new_releases', function(callback, results) {
      var flatAlbums = [];
      Object.keys(results.get_new_releases).forEach(function(artist) {
        results.get_new_releases[artist].forEach(function(album) {
          if (album.hasOwnProperty('json')) {
            var obj = JSON.parse(album.json);
            delete album.json;
            album.icon = obj.icon;
            album.released = tsToDateString(album.released);
            album.discovered = tsToDateString(album.discovered);
          }
          flatAlbums.push(album);
        });
      });
      callback(null, flatAlbums);
    }]
  }, function(err, results) {
    if (err) {
      res.render('error', {unknownErr: err});
    } else {
      // set the cookie so we know the next time they visit.
      res.cookie('lastWyws', Date.now(), { path: '/', maxAge: TWO_YEARS});
      var message = '';
      if (results.flatten_albums.length === 0) {
        message = 'Nothing for you!'
      }
      res.render('sleeping_results', {
        // todo: would be awful geeky to include database timings in here.
        results: results.flatten_albums,
        message: message
      })
    }
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