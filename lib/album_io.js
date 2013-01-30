var fs = require('fs');

var async = require('async');
var Rdio = require('rdio-node').Rdio;

var settings = require('./config').settings;

var rdio = new Rdio({
  consumerKey: settings.RDIO_KEY,
  consumerSecret: settings.RDIO_SECRET
});
var __rdio = rdio;

// expects (err, [albumObj])
exports.collectNewAlbums = function(callback) {
  var start = 0,
      albums = [];
  async.whilst(function() {
    return start !== null;
  }, function(callback) {
    rdio.makeRequest('getNewReleases', {
      time: 'thisweek',
      start: start,
      count: 200
    }, function(err, res) {
      if (err) {
        callback(err);
      } else if (res.status === 'ok') {
        // res.result is the array of albums.
        if (res.result.length == 0) {
          // this causes the whilst to stop.
          start = null;
        } else {
          start += res.result.length;
          res.result.forEach(function(album) { albums.push(album); });
        }
        callback(null);
      } else {
        console.log('Unexpected result while pulling new albums');
        console.log(arguments);
        callback(new Error('Unexpected result while pulling new albums'));
      }
    });
  }, function(err) {
    if (err) {
      console.log(err);
      // todo callback an expected error.
      callback(err);
    } else {
      console.log('pulled ' + albums.length + ' albums');
      callback(null, albums);
    }
  });
}

exports.saveAlbumsLocally = function(path, albums, callback) {
  fs.writeFile(path, JSON.stringify(albums, null, '  '), 'utf8', callback);  
}

// expects(err, albumObjArr)
exports.loadAlbumsFromPath = function(path, callback) {
  fs.readFile(path, 'utf8', function(err, data) {
    var arr = [];
    if (data) {
      arr = JSON.parse(data);
    }
    callback(err, arr);
  });
}

exports.saveFileToDatabase = function(path, db, callback) {
  async.waterfall([
    fs.readFile.bind(fs, path, 'utf8'),
    function parse(json, callback) {
      callback(null, JSON.parse(json));
    },
    exports.saveAlbumsDatabase.bind(null, db)
  ], callback);
}

// expects(err, count)
exports.saveAlbumsDatabase = function(albums, db, callback) {
  var count = 0;
  async.forEach(albums, function(album, callback) {
    async.waterfall([
      db.albumExists.bind(db, album.key),
      function maybeSave(exists, callback) {
        if (exists) {
          callback(null);
        } else {
          db.saveAlbum(album, function(err) {
            if (!err) {
              count += 1;
            }
            callback(err);
          });
        }
      }
    ], callback);
  }, function(err) {
    callback(err, count);
  });
}

// expects(err, newAlbumObjects);
exports.extractNewAlbums = function(oldPath, newPath, callback) {
  // consider just the keys.
  async.waterfall([
    function loadThem(callback) {
      async.parallel([
        fs.readFile.bind(fs, oldPath),
        fs.readFile.bind(fs, newPath)
      ], callback);
    },
    function load(jsons, callback) {
      var oldKeys = JSON.parse(jsons[0]).map(function(o) {return o.key;}),
          newAlbums = JSON.parse(jsons[1]),
          newKeys = newAlbums.map(function(o) {return o.key;});
      oldKeys.forEach(function(k1) {
        var index = newKeys.indexOf(k1);
        if (index >= 0) {
          newKeys.splice(index, 1);
        }
      });
      callback(null, newKeys.map(function(key) {return newAlbums[key];}));
    }
  ], function(err, obj) {
    callback(err, obj);
  });
}
// TODO: test this method.

exports.setRdioUnsafe = function(newRdio) {
  if (newRdio) {
    rdio = newRdio;
  } else {
    rdio = __rdio;
  }
}


// get the database for this environment.


/*
sample result:

{ baseIcon: 'album/4/7/1/000000000026d174/1/square-200.jpg',
  releaseDate: '2013-01-22',
  artistUrl: '/artist/The_Hit_Crew/',
  duration: 5518,
  isClean: false,
  shortUrl: 'http://rd.io/x/Qj5kjjc',
  canStream: true,
  embedUrl: 'https://rd.io/e/Qj5kjjc',
  type: 'a',
  price: '9.99',
  key: 'a2543988',
  icon: 'http://cdn3.rd.io/album/4/7/1/000000000026d174/1/square-200.jpg',
  canSample: true,
  name: 'The Best Pop Hits of 1974, Vol. 2',
  isExplicit: false,
  artist: 'The Hit Crew',
  url: '/artist/The_Hit_Crew/album/The_Best_Pop_Hits_of_1974%2C_Vol._2/',
  artistKey: 'r68',
  length: 24,
  trackKeys: 
   [ 't27114011',
     't27114012',
     't27114013',
     't27114014',
     't27114015',
     't27114016',
     't27114017',
     't27114018',
     't27114019',
     't27114020',
     't27114021',
     't27114022',
     't27114023',
     't27114024',
     't27114025',
     't27114026',
     't27114027',
     't27114028',
     't27114029',
     't27114030',
     't27114031',
     't27114032',
     't27114033',
     't27114034' ],
  canTether: true,
  displayDate: 'Jan 22, 2013' 
}
  
 */
