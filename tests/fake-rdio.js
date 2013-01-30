var fs = require('fs');
var path = require('path');
var async = require('async');

function FakeRdio() {
  this._props = {};
}

FakeRdio.prototype.set = function(key, val) {
  this._props[key] = val;
}

FakeRdio.prototype.makeRequest = function(name, argObj, callback) {
  // dispatch
  this[name].apply(this, [argObj, callback]);
}

FakeRdio.prototype.getNewReleases = function(argObj, callback) {
  var retObj = {
    status: 'ok',
    result: []
  },
      self = this,
      count = argObj.count || 10000,
      start = argObj.start || 0;
  async.waterfall([
    function loadFile(callback) {
      fs.readFile(self._props.currentReleaseFile, 'utf8', callback);
    },
    function parseJson(json, callback) {
      var arr = JSON.parse(json);
      // now splice out what we want.
      callback(null, arr.slice(start, start + Math.min(count, arr.length-start)))
    },
    function assemble(subArr, callback) {
      retObj.result = subArr;
      callback(null);
    }
  ], function(err) {
    callback(err, retObj);
  });
}

FakeRdio.prototype.reset = function() {
  this.callCounts = {};  
}

exports.FakeRdio = FakeRdio;