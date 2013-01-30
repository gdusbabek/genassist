var util = require('util');

var async = require('async');

var settings = require('../config').settings;
var Database = require('./index').Database;

// the current version may not be the operational version.
var CURRENT_VERSION = 0;
var OPERATIONAL_VERSION = settings.RELATED_DB_VERSION;
var MIGRATIONS = [
  function migration0(db, callback) {
    callback(null);
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

// this has to be run every time regardless of the version of the database.
var DDL = [
  'create table if not exists meta_desc(version int)',
  'create table if not exists recent_related (artist varchar(255), album varchar(255), related_artist varchar(255), released datetime, discovered datetime)',
  'create index if not exists artist_discovered_idx on recent_related(related_artist asc, discovered desc)',
  'create table if not exists albums(albumId varchar(64) primary key, artist varchar(255), name varchar(255), json text)',
  'insert into meta_desc(version) values(' + CURRENT_VERSION + ')'
];

exports.options = {
  name: 'related_artists',
  migrations: MIGRATIONS,
  ddl: DDL,
  currentVersion: CURRENT_VERSION,
  operationalVersion: OPERATIONAL_VERSION,
  db: db
};

function RelatedDb(db) {
  Database.call(this);
  this.db = db;
}
util.inherits(RelatedDb, Database);

// callback(err)
RelatedDb.prototype.saveRelated = function(artist, album, relatedArtist, released, discovered, callback) {
  this.db.run('insert into recent_related values(?,?,?,?,?)', [artist, album, relatedArtist, released, discovered], callback);
}

// callback(err, [{artist, release}]
RelatedDb.prototype.getRelated = function(relatedArtist, numDays, callback) {
  var now  = Date.now(),
      then = now - (numDays * MS_PER_DAY);
  this.db.all('select artist, album, released, discovered from recent_related where related_artist = ? and discovered between ? and ?', [relatedArtist, then, now], function(err, rows) {
    callback(err, rows);
  });
}

RelatedDb.prototype.saveAlbum = function(albumObj, callback) {
  this.db.run('insert into albums values(?,?,?,?)', [albumObj.key, albumObj.artist, albumObj.name, JSON.stringify(albumObj)], callback);
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

// expects(err, RelatedDb)
exports.fromPath = function(path, callback) {
  var options = {};
  Object.keys(exports.options).forEach(function(key) {
    if (exports.options.hasOwnProperty(key)) {
      options[key] = exports.options[key];
    }
  });
  options.db = new sqlite3.Database(path);
  Database.initDb(options, function(err) {
    if (err) {
      callback(err);
    } else {
      callback(null, new RelatedDb(options.db));
    }
  });
}

exports.RelatedDb = RelatedDb;

