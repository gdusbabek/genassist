var config = require('../lib/config');

exports['test_correct_config'] = function(test, assert) {
  console.log('config file used is ' + config.__configFile);
  assert.strictEqual(config.settings.GARY, 'new testing config');
  test.finish();
}