var fs = require('fs');

var async = require('async');

exports.unlinkIfExists = function(path, callback) {
  async.waterfall([
    function checkExists(callback) {
      fs.exists(path, function(exists) {
        callback(null, exists);
      });
    },
    function remove(exists, callback) {
      if (!exists) {
        callback(null);
      } else {
        fs.unlink(path, callback);
      }
    }
  ], callback);  
}

exports.copyFile = function(src, dst) {
 	 //fs.createReadStream(src).pipe(fs.createWriteStream(dst));
 	 var data = fs.readFileSync(src);
 	 fs.writeFileSync(dst, data);
}