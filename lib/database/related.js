var util = require('util');
var utils = require('../util');

var async = require('async');

var settings = require('../config').settings;
var Database = require('./index').Database;

var CURRENT_VERSION = 2;
var MIGRATIONS = [
  function migration0(db, callback) {
    callback(null);
  },
  function migration1(db, callback) {
    async.series([
      db.run.bind(db, 'alter table albums add column released datetime default null', []),
      db.run.bind(db, 'alter table albums add column discovered datetime default null', []),
      db.run.bind(db, 'update albums set discovered = ?', [new Date(0)]),
      db.run.bind(db, 'drop table if exists recent_related', []),
      db.run.bind(db, 'drop index if exists artist_discovered_idx', []),
      db.run.bind(db, 'create table if not exists similar_artists(artist_name varchar(512) primary key, similars text, last_poll datetime)', [])
    ], callback);
  },
  function migration2(db, callback) {
    async.series([
      db.run.bind(db, 'create index if not exists album_discovered_index on albums(discovered asc)', []),
      db.run.bind(db, 'create index if not exists album_discovered_index2 on albums(discovered desc)', [])
    ], callback);
  }
];

var sqlite3 = require('sqlite3').verbose();
var db;
try {
  db = new sqlite3.Database(settings.RELATED_DB_PATH);
} catch (typeerror) {
  // dang! don't use the defaults!
}

var MS_PER_DAY = 1000 * 60 * 60 * 24;

var DDL = [
  'create table if not exists meta_desc(version int)',
  'create table if not exists albums(albumId varchar(64) primary key, artist varchar(255), name varchar(255), json text, released datetime, discovered datetime)',
  'create table if not exists similar_artists(artist_name varchar(512) primary key, similars text, last_poll datetime)',
  'create index if not exists album_discovered_index_asc on albums(discovered asc)',
  'create index if not exists album_discovered_index_dsc on albums(discovered desc)',
  'insert into meta_desc(version) values(' + CURRENT_VERSION + ')'
];

exports.options = {
  name: 'related_artists',
  migrations: MIGRATIONS,
  ddl: DDL,
  currentVersion: CURRENT_VERSION,
  db: db
};

function RelatedDb(db) {
  Database.call(this);
  this.db = db;
}
util.inherits(RelatedDb, Database);

RelatedDb.prototype.getAlbumsByArtistSince = function(artist, millisOld, callback) {
  var now = Date.now(),
      then = now - millisOld;
  this.db.all('select artist, name, released, discovered from albums where artist = ? and discovered between ? and ?', [artist, then, now], function(err, rows) {
//  this.db.all('select artist, name, released, discovered from albums where artist = ? and discovered > ? and discovered < ?', [artist, then, now], function(err, rows) {
    callback(err, rows);  
  });
}

function buildParamList(arr) {
  return arr.map(function(el) {return '?'; }).join(',');
}

// very similar to getAlbumsByArtistSince except that a subquery is used.
RelatedDb.prototype.getAlbumsByArtistsSince = function(artists, millisOld, callback) {
  var now = Date.now(),
      then = now - millisOld,
      params = [],
      queryString = 'select artist, name, released, discovered, json from albums where artist in (' + buildParamList(artists) + ') and discovered between ? and ?';
  artists.forEach(function(a) { params.push(a); });
  params.push(then);
  params.push(now);
  this.db.all(queryString, params, function(err, rows) {
    callback(err, rows);
  })
}

RelatedDb.prototype.saveAlbum = function(albumObj, callback) {
  var releaseDate = utils.strToDate(albumObj.releaseDate), 
      discoveredDate = new Date(Date.now());
  if (!utils.isValidDate(releaseDate)) {
    releaseDate = discoveredDate;
    console.log('Invalid date for album ' + albumObj.key);
    console.log(albumObj);
  }
  this.db.run('insert into albums values(?,?,?,?,?,?)', [albumObj.key, albumObj.artist, albumObj.name, JSON.stringify(albumObj), releaseDate, discoveredDate], callback);
}

RelatedDb.prototype.albumExists = function(key, callback) {
  this.db.get('select albumId from albums where albumId = ?', [key], function(err, res) {
    callback(err, res && res.hasOwnProperty('albumId') && res.albumId === key);
  });
}

RelatedDb.prototype._truncateUnsafe = function(callback) {
  this.db.run('delete from albums', [], callback);
}

RelatedDb.prototype.getAlbumCount = function(callback) {
  this.db.get('select count(*) from albums', function(err, res) {
    if (err) {
      callback(err);
    } else {
      callback(null, res['count(*)']);
    }
  });
}

// expects(err, ts, artistNameArr);
RelatedDb.prototype.getSimilarArtists = function(artist, callback) {
  this.db.get('select last_poll, similars from similar_artists where artist_name = ?', [artist], function(err, res) {
    if (err) {
      callback(err);
    } else {
      var lastPoll = 0,
          similars = [];
      if (res) {
        lastPoll = res.last_poll;
        similars = res.similars.split('^');
      }
      callback(null, lastPoll, similars);
    }
  });
}

RelatedDb.prototype.setSimilarArtists = function(artist, similars, last_poll, callback) {
  var sim = similars.join('^');
  this.db.run('insert or replace into similar_artists(artist_name, similars, last_poll) values(?,?,?)', [artist, sim, last_poll], callback);
}

// expects(err, timestamp);
RelatedDb.prototype.getLastSimilarPoll = function(artist, callback) {
  this.db.get('select last_poll from similar_artists where artist_name = ?', [artist], function(err, res) {
    var lastPoll = 0;
    if (!err && res) {
      lastPoll = res.last_poll;
    }
    callback(err, lastPoll);
  });
}

// expects(err, artistNameArr)
RelatedDb.prototype.getArtistsWithNoSimilars = function(callback) {
  this.db.all('select distinct artist from albums where artist not in (select artist_name from similar_artists)', [], function(err, res) {
    if (err) { callback(err); return; }
    // results need to be reduced to a simple array instead of an array of {artist: 'foo'} objects.
    callback(null, res.map(function(obj) { return obj.artist; }));
  });
}

// expects(err, artstNameArr)
RelatedDb.prototype.getStaleSimilars = function(olderThanDays, callback) {
  var millis = 1000 * 60 * 60 * 24 * olderThanDays;
  this.db.all('select distinct artist_name from similar_artists where last_poll < ?', [new Date(Date.now() - millis)], function(err, res) {
    if (err) { callback(err); return; }
    // map results to an array of strings from an array of objects.
    callback(null, res.map(function(obj) { return obj.artist_name; }));
  });
}

exports.RelatedDb = RelatedDb;
exports.Constructor = RelatedDb;
 