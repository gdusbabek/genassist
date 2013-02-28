var fs = require('fs');
var echo = require('../lib/echo');
var FakeNestFactory = require('./fake_echo').FakeNestFactory;

exports['setUp'] = function(test, assert) {
  echo.setNestFactoryUnsafe(new FakeNestFactory());
  test.finish();
}

exports['test-get_similar_aritsts'] = function(test, assert) {
  echo.getSimilarArtists('Beachniks', function(err, artistNameArr) {
    assert.ifError(err);
    assert.strictEqual(25, artistNameArr.length);
    test.finish();
  });
  test.finish();
}

exports['test-convert-songs-spotify'] = function(test, assert) {
    var json = fs.readFileSync('tests/data/echonest_dynamic_playlist_augment_spotify.json', 'utf8'),
        results = JSON.parse(json),
        songs = [];

    assert.ok(results.songs.length > 0);

    results.songs.forEach(function(song) {
        var newSong = echo.convertServiceSong(song);
        assert.strictEqual('spotify', newSong.foreign_service);
        assert.ok(newSong.foreign_id);
        songs[songs.length] = echo.convertServiceSong(song);
    });

    test.finish();
}

exports['test-convert-songs-rdio'] = function(test, assert) {
    var json = fs.readFileSync('tests/data/echonest_dynamic_playlist_augment_rdio.json', 'utf8'),
        results = JSON.parse(json),
        songs = [];

    assert.ok(results.songs.length > 0);

    results.songs.forEach(function(song) {
        var newSong = echo.convertServiceSong(song);
        assert.strictEqual('rdio', newSong.foreign_service);
        assert.ok(newSong.foreign_id);
        songs[songs.length] = echo.convertServiceSong(song);
    });

    test.finish();
}

exports['test-convert-songs-no-service'] = function(test, assert) {
    var json = fs.readFileSync('tests/data/echonest_dynamic_playlist_augment_no_service.json', 'utf8'),
        results = JSON.parse(json),
        songs = [];

    assert.ok(results.songs.length > 0);

    results.songs.forEach(function(song) {
        var newSong = echo.convertServiceSong(song);
        assert.strictEqual(null, newSong.foreign_service);
        assert.strictEqual(null, newSong.foreign_id);
        songs[songs.length] = echo.convertServiceSong(song);
    });

    test.finish();
}