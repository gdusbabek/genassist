var util = require('util');
var utils = require('../util');

var async = require('async');

var settings = require('../config').settings;
var Database = require('./index').Database;

// the current version may not be the operational version.
var CURRENT_VERSION = 1;
var OPERATIONAL_VERSION = settings.RELATED_DB_VERSION;
var MIGRATIONS = [
  function migration0(db, callback) {
    callback(null);
  },
  function migration1(db, callback) {
    async.series([
      db.run.bind(db, 'create table if not exists similar_artists(artist_name varchar(512), similars text, last_poll datetime)', []),
      db.run.bind(db, 'create unique index if not exists similar_artist_idx on similar_artists(artist_name)', []),
      db.run.bind(db, 'alter table albums add column discovered datetime', []),
      db.run.bind(db, 'update albums set discovered = ?', [new Date(0)])
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
  'create table if not exists recent_related (artist varchar(255), album varchar(255), related_artist varchar(255), released datetime, discovered datetime)',
  'create index if not exists artist_discovered_idx on recent_related(related_artist asc, discovered desc)',
  'create table if not exists albums(albumId varchar(64) primary key, artist varchar(255), name varchar(255), json text, discovered datetime)',
  'create table if not exists similar_artists(artist_name varchar(512) primary key, similars text, last_poll datetime)',
  'create table if not exists top_artists(user varchar(255) primary key, artists test, last_poll datetime)',
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
  var albumDate = utils.strToDate(albumObj.releaseDate);
  if (!utils.isValidDate(albumDate)) {
    albumDate = new Date(Date.now());
    console.log('Invalid date for album ' + albumObj.key);
    console.log(albumObj);
  }
  this.db.run('insert into albums values(?,?,?,?,?)', [albumObj.key, albumObj.artist, albumObj.name, JSON.stringify(albumObj), albumDate], callback);
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

RelatedDb.prototype.setTopArtists = function(user, artists, lastPoll, callback) {
  var art = artists.join('^');
  this.db.run('insert or replace into top_artists(user, artists, last_poll) values(?,?,?)', [user, art, lastPoll], callback);
}

RelatedDb.prototype.getTopArtists = function(user, callback) {
  this.db.get('select last_poll, artists from top_artists where user = ?', [user], function(err, res) {
    if (err) {
      callback(err);
    } else {
      var lastPoll = 0,
          artists = [];
      if (res) {
        lastPoll = res.last_poll;
        artists = res.artists.split('^');
      }
      callback(null, lastPoll, artists);
    }
  });
}

RelatedDb.prototype.getLastTopPoll = function(user, callback) {
  this.db.get('select last_poll from top_artists where user = ?', [user], function(err, res) {
    var lastPoll = 0;
    if (!err && res) {
      lastPoll = res.last_poll;
    }
    callback(err, lastPoll);
  });
}

exports.RelatedDb = RelatedDb;
exports.Constructor = RelatedDb;
