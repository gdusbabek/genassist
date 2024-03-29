var settings = require('./config').settings;
var async = require('async');
var Rdio = require('rdio-node').Rdio;
var UserDb = require('./database/context').UserDb;

var params = {
    consumerKey: settings.RDIO_KEY,
    consumerSecret: settings.RDIO_SECRET
//    authorizeCallback: 'http://localhost:2000/rdio_comeback.html'
};

function dedupeSongs(songs) {
    var newSongs = [];
    var concatSongs = [];
    songs.forEach(function(song) {
        var wholeSong = song.artist + ':' + song.name;
        if (concatSongs.indexOf(wholeSong) < 0) {
            newSongs[newSongs.length] = song;
            concatSongs[concatSongs.length] = wholeSong;
        }
    });
    return newSongs;
}

// expects?
exports.search = function(q, callback) {
    var rdio = new Rdio(params),
        rdioQuery = {
            query: q,
            types: 'Song'
        }
    rdio.makeRequest('search', rdioQuery, function(err, results) {
        if (err) {
            callback(err, null);
        } else {
            var status = results.status,
                track_count = results.result.track_count,
                number_results = results.result.number_results,
                songs = results.result.results,
                songsBack = [];
            songs.forEach(function(song) {
                songsBack[songsBack.length] = {artist: song.artist, title: song.name};
            });
            songsBack = dedupeSongs(songsBack);
            callback(err, songsBack);
        }
    });
}

// expects(err, userObj);
exports.getUser = function(user, callback) {
  var rdio = new Rdio(params),
      rdioQuery = {
        query: user,
        types: 'User',
        count: 1
      };
  rdio.makeRequest('search', rdioQuery, function(err, results) {
    if (err) {
      callback(err, null);
    } else {
      if (results.status === 'ok' && results.result.person_count < 1) {
        callback(new Error('Could not find user'))
      } else if (results.status === 'ok') {
        callback(null, results.result.results[0]);
      } else {
        console.log(results);
        callback(new Error('Problem looking up user'));
      }
    }
  });
}

// expects(err, artistObj); 
exports.getTopArtists = function(user, callback) {
  var rdio = new Rdio(params);
  async.waterfall([
    exports.getUser.bind(null, user),
    function getAlbums(userObj, callback) {
      var rdioQuery = {
        user: userObj.key,
        type: 'artists',
        friends: 'false',
        limit: 25,
        count: 25
      }
      rdio.makeRequest('getHeavyRotation', rdioQuery, function(err, results) {
        if (err) {
          callback(err);
        } else if (results.status !== 'ok') {
          console.log(results);
          callback(new Error('Unexpected rdio status'));
        } else {
          callback(null, results.result); 
        }
      });
    }
  ], callback);
}

function Store(contextId) {
    this.data = {}
    this.contextId = contextId;
}

Store.prototype.get = function(key) {
    return this.data[key];
}

Store.prototype.set = function(key, val) {
    this.data[key] = val;
}

Store.prototype.remove = function(key) {
    delete this.data[key];
}

Store.prototype.removeAll = function() {
    this.data = {};
}

// callback expects(err)
Store.dump = function(store, callback) {
  UserDb.newShared(function(err, db) {
    if (err) {
      callback(err);
    } else {
      db.setRdioObject(store.contextId, store.data, callback);
    }
  });
}


Store.load = function(contextId, callback) {
  var store = new Store(contextId);
  UserDb.newShared(function(err, db) {
    if (err) {
      callback(err);
    } else {
      db.getRdioObject(contextId, function(err, rdioJson) {
        if (err) {
            callback(err);
        } else {
            store.data = JSON.parse(rdioJson);
            callback(null, store);
        }
      });  
    }
  });
    
}

exports.Store = Store;

// options:
//   {String} callbackUrl,
//   {String} contextId,
// callback expects(err, rdio)
exports.getAuthRdio = function(options, callback) {
    var p = {
        consumerKey: settings.RDIO_KEY,
        consumerSecret: settings.RDIO_SECRET,
        authorizeCallback: options.callbackUrl
        //dataStore: new Store(options.contextId)
    };
    async.waterfall([
        function loadStore(callback) {
            Store.load(options.contextId, function(err, store) {
                if (err) {
                    callback(err);
                } else {
                    p.dataStore = store;
                    callback(null);
                }
            });
        },
        function create(callback) {
            var r = new Rdio(p);
            callback(null, r);
        }
    ], callback);
}


