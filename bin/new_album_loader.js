#!/usr/bin/node
var fs = require('fs');
var path = require('path');
var util = require('util');

var async = require('async');

var settings = require('../lib/config').settings;
var albumIO = require('../lib/album_io');
var Database = require('../lib/database/index').Database;
var related = require('../lib/database/related');

var argv = require('optimist')
        .alias('f', 'cache')
        .alias('c', 'current')
        .alias('p', 'previous')
        .alias('d', 'database')
        .argv;

/*
Accepted options:
-f, --cache           : location of the cache path. Files are written to and read from here. $CACHE_PATH/albums
-c, --current         : location of current album json.  If this is present, we skip loading album json from rdio and 
                        look for a current_albums.json and treat that as if it were just loaded from the service.
-p, --previous        : use this instead of previous_albums.json.
-d, --database        : path to database file.

 */

// ok. let's figure out where things are being kept.
// first we need to know where we will be writing things.
var ioDir = argv.cache || path.join(settings.CACHE_PATH, 'albums');
var currentJson = argv.current || path.join(ioDir, 'current_albums.json');
var previousJson = argv.previous || path.join(ioDir, 'previous_albums.json');
var dbPath = argv.database || settings.RELATED_DB_PATH;
var now = Date.now();
var skipHousekeeping = argv.current ? true : false;

var allArchiveJsonPath = path.join(ioDir, now + '_all.json');
var newArchiveJsonPath = path.join(ioDir, now + '_new.json');

// expects(err, [albumObj]
function fetchAlbums(callback) {
  if (argv.current) {
    console.log('skipping rdio pull, using ' + currentJson);
    callback(null, null);
  } else {
    // load from rdio.
    console.log('loading from rdio');
    albumIO.collectNewAlbums(callback);
  }
}

// expects(err) 
function writeCurrentAlbums(albumArr, callback) {
  if (!albumArr) {
    callback(null);
  } else {
    console.log('writing new albums to ' + currentJson + ' and ' + allArchiveJsonPath);
    var json = JSON.stringify(albumArr, null, '  ');
    async.parallel([
      fs.writeFile.bind(null, currentJson, json, 'utf8'),
      fs.writeFile.bind(null, allArchiveJsonPath, json, 'utf8')
    ], function(err, res) {
      callback(err);
    });
  }
}

function saveNewToFile(albumArr, callback) {
  console.log('saving new albums to ' + newArchiveJsonPath);
  albumIO.saveAlbumsLocally(newArchiveJsonPath, albumArr, function(err) {
    callback(err);
  });
}

function saveNewToDatabase(db, albumArr, callback) {
  console.log('saving new albums to database at ' + dbPath);
  async.waterfall([
    function saveToDb(callback) {
      albumIO.saveAlbumsDatabase(albumArr, db, function(err, count) {
        if (count) {
          console.log('Saved ' + count + ' to database');
        }
        callback(err);
      });
    }
  ], callback);
}

function extractArtistsFromAlbums(albumArr, callback) {
  var artists = [];
  albumArr.forEach(function(album) {
    if (artists.indexOf(album.artist) < 0) {
      artists.push(album.artist);
    }
  });
  callback(null, artists);
}

function mkdir(path, callback) {
  fs.mkdir(path, function(err) { 
    if (!err) {
      callback(null);
    } else {
      if (err.code === 'EEXIST') {
        callback(null);
      } else {
        callback(err);
      }
    }
  });
}

// current becomes previous if current exists.
function housekeeping(callback) {
  // short circuit yo.
  if (skipHousekeeping) {
    console.log('skipping housekeeping');
    callback(null);
    return;
  }
  
  async.waterfall([
    function checkExists(callback) {
      fs.exists(currentJson, function(exists) { callback(null, exists); });  
    },
    function moveIt(exists, callback) {
      if (!exists) {
        console.log('no housekeeping needed');
        callback(null, exists);
      } else {
        console.log('moving ' + currentJson + ' -> ' + previousJson);
        var is = fs.createReadStream(currentJson),
            os = fs.createWriteStream(previousJson);
        util.pump(is, os, function() {
          callback(null, exists);
        });
      }
    },
    function maybeDelete(exists, callback) {
      if (!exists) {
        callback(null);
      } else {
        fs.unlink(currentJson, callback);
      }
    }
  ], callback);
}

// expects(err, albumObjArr)
function extractNewAlbums(oldPath, newPath, callback) {
  albumIO.extractNewAlbums(oldPath, newPath, function(err, albumArr) {
    if (!err) {
      console.log('discovered ' + albumArr.length + ' new albums');
    }
    callback(err, albumArr);
  });
}

console.log('starting album load at ' + now);
console.log('using config at ' + settings.__configFile);
// todo: an appropriate amount of logging.
async.auto({
    make_directory: mkdir.bind(null, ioDir),
    do_housekeeping: ['make_directory', housekeeping.bind(null)],
    get_database: ['do_housekeeping', Database.fromPath.bind(null, dbPath, related)],
    fetch_albums: ['do_housekeeping', fetchAlbums.bind(null)],
    write_current_albums: ['fetch_albums', function(callback, results) {
      writeCurrentAlbums(results.fetch_albums, callback);
    }],
    extract_new_albums: ['write_current_albums', extractNewAlbums.bind(null, previousJson, currentJson)],
    save_new_to_file: ['extract_new_albums', function(callback, results) {
      saveNewToFile(results.extract_new_albums, callback);
    }],
    save_new_to_database: ['get_database', 'extract_new_albums', function(callback, results) {
      saveNewToDatabase(results.get_database, results.extract_new_albums, callback);
    }],
    extract_new_artists: ['extract_new_albums', function(callback, results) {
      extractArtistsFromAlbums(results.extract_new_albums, callback);
    }]
}, 
function(err) {
  if (err) {
    console.log(settings.__configFile);
    console.log(err);
  } else {
    console.log('all done');
  }
  var finishedAt = Date.now();
  console.log('pull took ' + (finishedAt - now) + ' ms. ');
  console.log(new Date());
  console.log('\n\n');
});
