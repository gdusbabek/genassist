var async = require('async');

var THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

var echo = require('./echo');
var rdio = require('./rdio');
var LastClient = require('./lastfm').Client;
var lastfm = new LastClient();

// err, aritstNameArr
function getTopArtists(user, service, callback) {
  if (service === 'rdio') {
    rdio.getTopArtists(user, function(err, artistObjArr) {
      if (err) { callback(err); return; }
      callback(null, artistObjArr.map(function(obj) { return obj.name; }));
    });
  } else if (service === 'lastfm') {
    lastfm.getTopArtists(user, function(err, artistObjArr) {
      if (err) { callback(err); return; }
      if (!artistObjArr) {
        callback(null, []);
      } else {
        callback(null, artistObjArr.map(function(obj) { return obj.name; }));
      }
    });
  }
}


exports.getAllSimilars = function(artistNames, db, callback) {
  var sims = {};
  async.forEach(artistNames, function(artist, callback) {
    async.waterfall([
      
      function initArtist(callback) {
        sims[artist] = [];
        callback(null);
      },
      
      function getFromDb(callback) {
        db.getSimilarArtists(artist, function(err, lastPoll, simNameArr) {
          if (err) { callback(err); return; }
          if (Date.now() - THIRTY_DAYS > lastPoll) {
            callback(null, []);
          } else {
            callback(null, simNameArr);
          }
        });
      },
      
      function getFromService(simNameArr, callback) {
        if (simNameArr.length > 0) {
          callback(null, simNameArr, false);
        } else {
          echo.getSimilarArtists(artist, function(err, simNameArr) {
            if (err) { callback(err); return; }
            callback(null, simNameArr, true);
          });
        }
      },
      
      function saveSimilars(simNameArr, save, callback) {
        if (save) {
          db.setSimilarArtists(artist, simNameArr, Date.now(), function(err) {
            callback(err, simNameArr);
          });
        } else {
          callback(null, simNameArr);
        }
      },
      
      function mergeSims(simNameArr, callback) {
        simNameArr.forEach(function(name) {
          if (sims[artist].indexOf(name) < 0) {
            sims[artist].push(name);
          }
        });
        callback(null);
      }
      
    ], callback);
  }, function(err) {
    callback(err, sims);
  });
}

exports.getTopArtists = function(user, services, db, callback) {
  var allArtists = [];
  async.forEach(services, function(serviceName, callback) {
    async.waterfall([
      
      function getTopFromDb(callback) {
        db.getTopArtists(user, serviceName, function(err, lastPoll, artists) {
          if (err) { callback(err); return; }
          if (Date.now() - THIRTY_DAYS > lastPoll) {
            // return nothing results are stale.
            callback(null, []);
          } else {
            callback(null, artists);
          }
        });
      },
      
      function loadTopFromService(dbArtists, callback) {
        if (dbArtists.length === 0) {
          getTopArtists(user, serviceName, function(err, artistNames) {
            if (err) { callback(err); return; }
            callback(null, artistNames, true);
          });
        } else {
          callback(null, dbArtists, false);
        }
      },
      
      function saveNewArtists(artists, save, callback) {
        if (!save) {
          callback(null, artists);
        } else {
          db.setTopArtists(user, serviceName, artists, Date.now(), function(err) {
            if (err) { callback(err); return; }
            callback(null, artists);
          });
        }
      }
    ], function combineSimilarArtists(err, artistNames) {
      if (artistNames) {
        artistNames.forEach(function(artist) {
          if (allArtists.indexOf(artist) < 0) {
            allArtists.push(artist);
          }
        });
      }
      callback(err);
    });
  }, function(err) {
    callback(err, allArtists);
  });
}