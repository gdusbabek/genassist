
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