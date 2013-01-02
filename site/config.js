var fs = require('fs');
var path = require('path');
var NODE_ENV = process.env.NODE_ENV || 'development';

// Here is how we search for a config:
// 1. look in env.GENASSIST_CONFIG_DIR
// 2. look in ~
// 3. look in /etc/genassist
// for a file called genassist_${environment}_config.js that exports settings.
// merge those with the current settings. done.

var configSearchDirs = [];
if (process.env.GENASSIST_CONFIG_DIR) {
    configSearchDirs.push(process.env.GENASSIST_CONFIG_DIR);
}
if (process.env.HOME) {
    configSearchDirs.push(process.env.HOME);
}
if (fs.existsSync('/etc/genassist')) {
    configSearchDirs.push('/etc');
}

function searchPathsForConfig(paths) {
    var i = 0,
        configFile;
    for (i = 0; i < paths.length; i++) {
        if (fs.existsSync(paths[i])) {
            configFile = path.join(paths[i], 'genassist_' + NODE_ENV + '_config.js');
            if (fs.existsSync(configFile)) {
                return configFile;
            }
        }
    }
    return null;
}

// overwrites.
function mergeSettings(base, augments) {
    Object.keys(augments).forEach(function(key) {
        if (augments.hasOwnProperty(key)) {
            base[key] = augments[key];
        }
    });
    return base;
}

// default settings go here.
var settings = {
    // rdio api.
    RDIO_KEY: null,
    RDIO_SECRET: null,
    
    // echonest api
    ECHO_KEY: null,
    ECHO_CONSUMER: null,
    ECHO_SECRET: null,
    
    // last.fm api
    LAST_KEY: null,
    LAST_SECRET: null,
    
    CONTEXT_DIR: '/tmp/genassist/contexts',
    APP_HOST: null,
    APP_PORT: null
};

// search for the first config available.
var configFile = searchPathsForConfig(configSearchDirs);

if (configFile) {
    console.log('augmenting config with ' + configFile);
    settings = mergeSettings(settings, require(configFile).settings);
}

exports.settings = settings;