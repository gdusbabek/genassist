var crypto = require('crypto');
var fermata = require('fermata');

var settings = require('../../lib/config').settings;

var VERSION = '2.0';
var URL = 'http://ws.audioscrobbler.com';
var API_KEY = settings.LAST_KEY;
var API_SECRET = settings.LAST_SECRET;

function scrub(object) {
    if (object.hasOwnProperty('@attr')) {
        object._attrs = object['@attr'];
        delete object['@attr'];
    }
    if (object.hasOwnProperty('#text')) {
        object._text = object['#text'];
        delete object['#text'];
    }
    Object.keys(object).forEach(function(key) {
        if (object.hasOwnProperty(key) && typeof(object[key]) === 'object') {
            scrub(object[key]);
        }
    });
}

exports.sign = function(params) {
    var keys = Object.keys(params);
    keys.sort();
    var signature = '';
    keys.forEach(function(key) {
        signature += key + params[key];
    });
    signature += API_SECRET;
    var md5sum = crypto.createHash('md5');
    md5sum.update(signature);
    return md5sum.digest('hex');
}

function Client(api_key, api_secret) {
    this.api_key = api_key || API_KEY;
    this.api_secret = api_secret || API_SECRET;
}

Client.prototype.execute = function(method, params, callback) {
    var self = this,
        p = {
            method: method,
            api_key: self.api_key,
            format: 'json'
        };
    Object.keys(params).forEach(function(key) {
        p[key] = params[key];
    });
    fermata.json(URL)(VERSION)(p).get(callback);
};

Client.prototype.executePostSigned = function(method, params, callback) {
    var api_sig = exports.sign(params),
        self = this,
        p = {
            method: method,
            api_key: self.api_key,
            format: 'json'
        };
    Object.keys(params).forEach(function(key) {
        p[key] = params[key];
    });
    p.api_sig = api_sig;
    fermata.json(URL)(VERSION)(p).post(callback);
}

// expects(err, boolean)
Client.prototype.isLoved = function(artist, song, user, callback) {
    var self = this;
    self.execute('track.getInfo', {
        artist: artist,
        track: song,
        username: user
    }, function(err, response) {
        if (err) {
            callback(err);
        } else if (response.error) {
            callback(new Error(response.message));
        } else if (response.track) {
            callback(null, response.track.userloved == 1);
        } else {
            callback(new Error('Unexpected: ' + JSON.stringify(response)));
        }
    });
}

exports.Client = Client;