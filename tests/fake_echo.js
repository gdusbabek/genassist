var fs = require('fs');
var path = require('path');
var async = require('async');

function FakeArtist() { }

FakeArtist.prototype.similar = function(opts, callback) {
  // opts.name
  var resultJson = fs.readFileSync('tests/data/echonest_artist_similar_to_' + opts.name + '.json');
  var result = JSON.parse(resultJson);
  callback(null, result);
}

function FakeEcho() {
  this.artist = new FakeArtist();
}

function FakeNestFactory() {}
FakeNestFactory.prototype.make = function() {
  return new FakeEcho();
}

exports.FakeNestFactory = FakeNestFactory;




