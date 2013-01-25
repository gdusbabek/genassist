var async = require('async');

var settings = require('../config').settings;

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


// this has to be run every time regardless of the version of the database.
var DDL = [
  'create table if not exists meta_desc(version int)',
  'create table if not exists recent_related (artist varchar(255), album varchar(255), release datetime, related_artist varchar(255))',
  'create index if not exists artist_release_idx on recent_related(related_artist asc, release asc)',
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