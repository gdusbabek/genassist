#!/usr/bin/node

// get users top artists (rdio and lastfm)
// construct set of related artists (populate if need be)
// select new albums from that set.

var async = require('async');

var settings = require('../lib/config').settings;
var Database = require('../lib/database/index').Database;
var topArtist = require('../lib/database/topArtist');
var related = require('../lib/database/related');
var artistIO = require('../lib/artist_io');

var argv = require('optimist')
  .alias('u', 'user')
  .alias('s', 'service')
  .alias('a', 'artist_db')
  .alias('o', 'song_db')
  .describe('u', 'user to look up')
  .describe('s', 'service to retrieve top artists from (lastfm or rdio)')
  .describe('a', 'path to artist db')
  .describe('o', 'path to song db')
  .argv;

function dateToString(d) {
  return (d.getMonth() + 1) + '/' + d.getDate() + '/' + (1900 + d.getYear());
}

async.auto({
  'artist_db': Database.fromPath.bind(null, argv.artist_db || settings.TOP_ARTIST_DB_PATH, topArtist),
  'song_db': Database.fromPath.bind(null, argv.song_db || settings.RELATED_DB_PATH, related),
  'get_top_artists': ['artist_db', function(callback, results) {
    console.log('getting top artists for ' + argv.user + '...');
    artistIO.getTopArtists(argv.user, argv.service.split(','), results.artist_db, callback);
  }],
  'get_similar_artists': ['get_top_artists', 'song_db', function(callback, results) {
    console.log('looking up related artists...');
    artistIO.getAllSimilars(results.get_top_artists, results.song_db, callback);
  }],
  'invert_similars': ['get_similar_artists', function(callback, results) {
    console.log('inverting results...');
    var sims = {};
    Object.keys(results.get_similar_artists).forEach(function(artist) {
      if (!sims[artist]) {
        sims[artist] = [];
      }
      sims[artist].push(artist);
      results.get_similar_artists[artist].forEach(function(match) {
        if (!sims[match]) {
          sims[match] = [];
        }
        sims[match].push(artist);
      });
    });
    callback(null, sims);
  }],
  'get_new_releases': ['invert_similars', 'song_db', function(callback, results) {
    console.log('looking up new releases...');
    var THREE_MONTHS = 3 * 30 * 24 * 60 * 60 * 1000,
        newAlbums = {};
    
    results.song_db.getAlbumsByArtistsSince(Object.keys(results.invert_similars), THREE_MONTHS, function(err, rows) {
      if (err) { callback(err); return; }
      if (rows.length > 0) {
        rows.forEach(function(album) {
          if (!newAlbums.hasOwnProperty(album.artist)) {
            newAlbums[album.artist] = [];
          }
          album.similarToArtists = results.invert_similars[album.artist];
          newAlbums[album.artist].push(album);
        });
      }
      callback(null, newAlbums);
    });
  }]
  
}, function(err, results) {
  if (err) {
    console.log(err);
    process.exit(-1);
  } else {
    console.log(Object.keys(results.get_new_releases).length + ' recommendations for ' + argv.user);
    Object.keys(results.get_new_releases).forEach(function(artist) {
      results.get_new_releases[artist].forEach(function(album) {
        console.log(album.name + ' by ' + album.artist);
        console.log('  Released:' + dateToString(new Date(album.released)) + ', Discovered:' + dateToString(new Date(album.discovered)));
        console.log('  Similar to: ' + album.similarToArtists.join(','));
      });
    });
    process.exit(0);
  }
});