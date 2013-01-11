var util = require('./lib/util');
var TWO_YEARS = 1000 * 60 * 60 * 24 * 365 * 2;

exports.set_context_cookie = function() {
    return function(req, res, next) {
        // see if there is a context cookie
        if (!req.cookies || !req.cookies.context) {
            res.cookie('context', util.randomHash(128), {path: '/', maxAge: TWO_YEARS});
        }
        next();
    }
};