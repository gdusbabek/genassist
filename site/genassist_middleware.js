
var settings = require('./config').settings;
var util = require('./lib/util');
var database = require('./database');
var TWO_YEARS = 1000 * 60 * 60 * 24 * 365 * 2;

exports.set_context_cookie = function() {
    return function(req, res, next) {
        // see if there is a context cookie
        var ctxId = req.cookies.context;
        if (!ctxId) {
            ctxId = util.randomHash(64);
            req.cookies.context = ctxId;
            res.cookie('context', ctxId, {path: '/', maxAge: TWO_YEARS});
        }
        next();
    }
};

exports.shorten_context_id = function() {
    return function(req, res, next) {
        if (req.cookies.context && req.cookies.context.length > 64) {
            var newContext = req.cookies.context.substr(0, 64);
            req.cookies.context = newContext;
            res.clearCookie('context');
            res.cookie('context', newContext, {path: '/', maxAge: TWO_YEARS})
        }
        database.ensureUser(req.cookies.context, function(err) {
            if (err) {
                console.log('problem ensuring user');
                console.log(err);
            }
            next();
        });
    }
}

exports.move_lastfm_from_cookie = function() {
    return function(req, res, next) {
        if (settings.DB_VERSION >= 4 && req.cookies.lastSk) {
            res.clearCookie('lastSk');
            res.clearCookie('lastLink');
            next();
        } else {
            next();    
        }
    }
};