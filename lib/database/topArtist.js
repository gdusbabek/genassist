var util = require('util');
var utils = require('../util');

var async = require('async');

var settings = require('../config').settings;
var Database = require('./index').Database;

var CURRENT_VERSION = 0;
var MIGRATIONS = [
  function migration0(db, callback) {
    callback(null);
  }
];

var sqlite3 = require('sqlite3').verbose();
var db;
try {
  db = new sqlite3.Database(settings.TOP_ARTIST_DB_PATH);
} catch (typeerror) {
  // dang! don't use the defaults!
}

var DDL = [
  'create table if not exists meta_desc(version int)',
  'create table if not exists top_artists(user varchar(255), service varchar(255), artists text, last_poll datetime, primary key(user, service))',
  'insert into meta_desc(version) values(' + CURRENT_VERSION + ')'
];

exports.options = {
  name: 'top_artists',
  migrations: MIGRATIONS,
  ddl: DDL,
  currentVersion: CURRENT_VERSION,
  db: db
};

function TopArtistDb(db) {
  Database.call(this);
  this.db = db;
}
util.inherits(TopArtistDb, Database);

TopArtistDb.prototype.setTopArtists = function(user, service, artists, lastPoll, callback) {
  var art = artists.join('^');
  this.db.run('insert or replace into top_artists(user, service, artists, last_poll) values(?,?,?,?)', [user, service, art, lastPoll], callback);
}

TopArtistDb.prototype.getTopArtists = function(user, service, callback) {
  this.db.get('select last_poll, artists from top_artists where user = ? and service = ?', [user, service], function(err, res) {
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

TopArtistDb.prototype.getLastTopPoll = function(user, service, callback) {
  this.db.get('select last_poll from top_artists where user = ? and service = ?', [user, service], function(err, res) {
    var lastPoll = 0;
    if (!err && res) {
      lastPoll = res.last_poll;
    }
    callback(err, lastPoll);
  });
}

exports.TopArtistDb = TopArtistDb;
exports.Constructor = TopArtistDb;
