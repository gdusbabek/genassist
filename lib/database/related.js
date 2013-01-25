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
var db = new sqlite3.Database(settings.RELATED_DB_PATH);

var MS_PER_DAY = 1000 * 60 * 60 * 24;

// this has to be run every time regardless of the version of the database.
var DDL = [
  'create table if not exists meta_desc(version int)',
  'create table if not exists recent_related (artist varchar(255), album varchar(255), related_artist varchar(255), released datetime, discovered datetime)',
  'create index if not exists artist_discovered_idx on recent_related(related_artist asc, discovered desc)',
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

exports.RelatedDb = RelatedDb;