var utils = require('../lib/util');

exports['test_random_hash'] = function(test, assert) {
    var hash = utils.randomHash(128);
    assert.strictEqual(256, hash.length);
    test.finish();
}