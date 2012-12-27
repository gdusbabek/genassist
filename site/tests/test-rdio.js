var path = require('path');
var fs = require('fs');
var rdio = require('../lib/rdio');

exports['test_dump_and_load'] = function(test, assert) {
    var key = 'test_dump_key',
        dir = '/tmp',
        store = new rdio.Store(key);
    
    store.set('a', 'aaaa');
    store.set('b', 'bbbb');
    store.set('c', 'cccc');
    store.remove('b');
    
    assert.ok(store.get('a'));
    assert.strictEqual(store.get('b'), undefined);
    assert.ok(store.get('c'));
    
    rdio.Store.dump(store, dir);
    assert.ok(fs.existsSync(path.join(dir, key)));
    
    var newStore = rdio.Store.load(key, dir);
    
    assert.deepEqual(newStore.data, store.data);
    test.finish();
}