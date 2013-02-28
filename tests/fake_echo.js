var fs = require('fs');
var path = require('path');
var async = require('async');

var util = require('../lib/util');

function FakeArtist() { }

// will load from a file or generate 25 random artists.
FakeArtist.prototype.similar = function(opts, callback) {
  var file = 'tests/data/echonest_artist_similar_to_' + opts.name + '.json',
      result;
  if (fs.existsSync(file)) {
    result = JSON.parse(fs.readFileSync(file));
  } else {
    // create 25 random items.
    result = {
      status: {
        version: '4.2',
        code: 0,
        message: 'Success'
      },
      artists: []
    };
    var max = 25, i = 0;
    for (i = 0; i < max; i++) {
      result.artists.push({
        name: util.randstr(10),
        id: util.randstr(10)
      });
    }
  }
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




