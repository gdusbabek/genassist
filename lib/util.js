
var ch = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

exports.randomHash = function(numBytes) {
  var hash = '',
      next;
  while (numBytes > 0) {
    next = (Math.floor(Math.random() * 256)).toString(16);
    while (next.length < 2) {
      next = '0' + next;
    }
    hash += next;
    numBytes -= 1;
  }
  return hash;
}

// str is yyyy-mm-dd. mm is a zero based index into month (0 is January).
exports.strToDate = function(str) {
  var parts = str.split('-');
  return new Date(parts[0], parseInt(parts[1], 10) - 1, parts[2]);
}

exports.isValidDate = function(date) {
  return !isNaN(date.getTime());
}

exports.randstr = function(len) {
  var r, x;
  r = [];

  for (x = 0; x < len; x++) {
    r.push(ch[exports.randInt(0, ch.length - 1)]);
  }

  return r.join('');
};

exports.randInt = function(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};