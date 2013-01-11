
var settings = require('./config').settings;
var util = require('./lib/util');
var database = require('./database');
var TWO_YEARS = 1000 * 60 * 60 * 24 * 365 * 2;

exports.set_context_cookie = function() {
    return function(req, res, next) {
        // see if there is a context cookie
        if (!req.cookies || !req.cookies.context) {
            res.cookie('context', util.randomHash(64), {path: '/', maxAge: TWO_YEARS});
            // todo: should store stub in database.
        }
        next();
    }
};

exports.shorten_context_id = function() {
    return function(req, res, next) {
        if (req.cookies.context && req.cookies.context.length > 64) {
            var newContext = req.cookies.context.substr(0, 64);
            req.cookies.context = newContext;
            res.cookie('context', newContext, {path: '/', maxAge: TWO_YEARS})
        }
        next();
    }
}

exports.move_lastfm_from_cookie = function() {
    return function(req, res, next) {
        if (settings.DB_VERSION >= 4 && req.cookies.lastSk) {
            database.setLastSk(req.cookies.context, req.cookies.lastSk, function(err) {
                if (err) {
                    console.log(err);
                } else {
                    res.clearCookie('lastSk');
                    delete req.cookies['lastSk'];
                }
                next();
            });
        } else {
            next();    
        }
        
    }
};