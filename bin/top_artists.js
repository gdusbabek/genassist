#!/usr/bin/node
var async = require('async');

var settings = require('../lib/config').settings;
var rdio = require('../lib/rdio');
var lastfm = require('../lib/lastfm');
var Database = require('../lib/database/index').Database;
var topArtist = require('../lib/database/topArtist');


var argv = require('optimist')
  .alias('s', 'service')
  .alias('u', 'user')
  .alias('r', 'record')
  .alias('d', 'database')
  .describe('s', 'service to query: one of \'lastfm\' or \'rdio\'')
  .describe('u', 'user name to query')
  .describe('r', 'record the results (in the database)')
  .describe('d', 'path to artist database')
  .argv;

// callback(err, artistNameArr)
function getTopArtistsRdio(user, callback) {
  rdio.getTopArtists(user, function(err, artistObjArr) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, artistObjArr.map(function(artistObj) { return artistObj.name; }));
    }
  });
}

// callback(err, artistNameArr)
function getTopArtistsLastfm(user, callback ) {
  var client = new lastfm.Client();
  client.getTopArtists(user, function(err, artistObjArr) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, artistObjArr.map(function(artistObj) { return artistObj.name; }));
    }
  });
}

// callback(err, artistNameArr)
function getTopArtistsFake(user, callback) {
  callback(null, ['foo', 'bar', 'baz']);
}

async.auto({
  get_artists: function(callback) {
    console.log('looking up...');
    if (argv.service === 'lastfm') {
      getTopArtistsLastfm(argv.user, callback);
    } else if (argv.service === 'rdio') {
      getTopArtistsRdio(argv.user, callback);
    } else if (argv.service === 'fake') {
      getTopArtistsFake(argv.user, callback);
    }
  }, 
  get_db: function(callback) {
    if (!argv.d) {
      console.log('not saving');
      callback(null, null);
    } else {
      Database.fromPath(argv.database || settings.TOP_ARTIST_DB_PATH, topArtist, callback);
    }
  },
  save_artists: ['get_db', 'get_artists', function(callback, results) {
    if (argv.d) {
      console.log(results.get_artists);
      results.get_db.setTopArtists(argv.user, argv.service, results.get_artists, callback);
    } else {
      callback(null);
    }
  }]
  
}, function(err) {
  if (err) {
    console.log(err);
    process.exit(-1);
  } else {
    process.exit(0);
  }
});