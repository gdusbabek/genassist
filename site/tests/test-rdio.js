var path = require('path');
var fs = require('fs');
var async = require('async');
var rdio = require('../lib/rdio');

exports['test_dump_and_load'] = function(test, assert) {
    var key = 'test_dump_key',
        dir = '/tmp',
        store = new rdio.Store(key);
    
    store.set('a', 'aaaa');
    store.set('b', 'bbbb');
    store.set('c', 'cccc');
    store.remove('b');
    
    // verify that what I think is in there.
    assert.ok(store.get('a'));
    assert.strictEqual(store.get('b'), undefined);
    assert.ok(store.get('c'));
    
    async.waterfall([
        rdio.Store.dump.bind(null, store, dir),
        rdio.Store.load.bind(null, key, dir)
    ], function(err, newStore) {
        assert.ifError(err);
        assert.deepEqual(store.data, newStore.data);
        test.finish();
    });   
}

exports['test_get_auth_rdio'] = function(test, assert) {
    var options = {
        callbackUrl: 'http://www.example.com/bogus_callback.html',
        contextId: 'test_get_auth_rdio',
        contextDir: '/tmp'
    };
    rdio.getAuthRdio(options, function(err, client) {
        assert.ifError(err);
        assert.ok(fs.existsSync(path.join(options.contextDir, options.contextId)));
        test.finish();
    });
}

exports['test_streams_write'] = function(test, assert) {
    var stream = fs.createWriteStream('/tmp/testwrite.txt');
    stream.on('drain', function() {
        assert.ok(false);
    });
    stream.on('error', function() {
        assert.ok(false);
    });
    stream.on('close', function(err) {
        assert.ifError(err);
        test.finish();
    });
    stream.on('pipe', function() {
        assert.ok(false);
    });
    stream.write('this is a test to see what gets written');
    stream.end();
}

exports['test_streams_read'] = function(test, assert) {
    var contents = 'this is some text I want to test with.',
        stream, buf = '';
    fs.writeFileSync('/tmp/testread.txt', contents);
    stream = fs.createReadStream('/tmp/testread.txt');
    stream.setEncoding('utf8');
    stream.on('open', function(fd) { });
    stream.on('data', function(data) {
        buf += data;
    });
    stream.on('end', function() {
        assert.strictEqual(contents, buf);
        test.finish();
    });
    stream.on('error', function(err) {});
    stream.on('close', function() {});
}