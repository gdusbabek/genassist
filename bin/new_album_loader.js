#!/usr/bin/node
var fs = require('fs');

var async = require('async');

var settings = require('../lib/config').settings;
var albumIO = require('../lib/album_io');
var related = require('../lib/database/related');

var argv = require('optimist').argv;

// the way: collect, save file, save database.

// need a path,
var cachePath = argv['cache-path'] || settings.CACHE_PATH;
var jsonPath = argv['json-path'] || cachePath + '/album_' + Date.now() + '.json';

// need a database
var dbPath = argv['db-path'] || settings.RELATED_DB_PATH;

// read from rdio
// write to path
// read from path
// write to database

async.waterfall([
        function readFromRdio(callback) {
          if (argv['json-path']) {
            console.log('skipping rdio pull');
            callback(null, null);
          } else {
            console.log('pulling from rdio');
            albumIO.collectNewAlbums(callback);
          }
        },
        function writeToCache(albums, callback) {
          if (albums == null) {
            console.log('skipping cache write');
            callback(null, null);  
          } else {
            console.log('saving albums to ' + jsonPath);
            albumIO.saveAlbumsLocally(jsonPath, albums, callback);
          }
        },
        fs.readFile.bind(fs, jsonPath, 'utf8'),
        function saveToDbFromJson(json, callback) {
          related.fromPath(dbPath, function(err, db) {
            if (err) {
              callback(err);
            } else {
              console.log('saving albums to ' + dbPath);
              albumIO.saveAlbumsDatabase(JSON.parse(json), db, callback);
            }
          });
        }
], function(err) {
  if (err) {
    console.log(err);
  } else {
    console.log('Success!');
  }
});