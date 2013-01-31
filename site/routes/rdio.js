var async = require('async');
var rdio = require('../lib/rdio');
var settings = require('../../lib/config').settings;


var TWO_YEARS = 1000 * 60 * 60 * 24 * 365 * 2;
var cheatingAuth = new Error('You cannot access that url directly.');
var callbackBase = 'http://' + settings.PROXY_HOST +
        (settings.PROXY_PORT === 80 ? '' : (':' + settings.PROXY_PORT));
var callbackUrl = callbackBase + '/rdio_comeback.html';

exports.register = function(req, res) {
    var comeback = req.query.return ? (callbackUrl + '?return=' + req.query.return) : callbackUrl;
    async.waterfall([
        function getRdio(callback) {
            rdio.getAuthRdio({
                callbackUrl: comeback,
                contextId: req.cookies.context
            }, callback);
        },
        function checkIfLinked(client, callback) {
            if (req.cookies.rdioLink && client.dataStore_.get('accessToken')) {
                // short circuit
                async.waterfall([
                        function testRequest(callback) {
                            client.makeRequest('getPlaylists', function(err, results) {
                                callback(err);
                            });            
                        },
                        function render(callback) {
                            res.render('cookies', {});
                            callback(null);
                        }
                ], callback);
            } else {
                // continue with registration.
                async.waterfall([
                    function beginAuth(callback) {
                        client.beginAuthentication(function(err, loginUrl) {
                            callback(null, client, loginUrl);
                        });
                    },
                    function(client, loginUrl, callback) {
                        rdio.Store.dump(client.dataStore_, function(err) {
                            if (err) {
                                callback(err);
                            } else {
                                callback(null, loginUrl);
                            }
                        })
                    },
                    function redirectToRdio(loginUrl, callback) {
                        res.redirect(loginUrl);
                        callback(null);
                    }               
                ], callback);
            }
        }
    ], function(err, loginUrl) {
        if (err) {
            res.render('err', {unknownErr: err});
        }
    });
}

exports.linked_landing = function(req, res) {
    res.render('rdio_link', {
       linked: req.cookies.rdioLink ? true : false 
    });
}

exports.comeback = function(req, res) {
    // http://genassist.tagfriendly.com/rdio_comeback.html?oauth_verifier=6099&oauth_token=rbzccfjuwptcqcyth3bacmj7
    async.waterfall([
        function getRdio(callback) {
            rdio.getAuthRdio({
                callbackUrl: callbackUrl,
                contextId: req.cookies.context
            }, callback);
        },
        function completeAuth(rdioClient, callback) {
            try {
                rdioClient.completeAuthentication(req.query.oauth_verifier, function() {
                    // we should be able to get playlists now.
                    callback(null, rdioClient);
                });
            } catch (err) {
                callback(cheatingAuth, null);
            }
        },
        function saveData(client, callback) {
            // set the cookie.
            rdio.Store.dump(client.dataStore_, function(err) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, client);
                }
            });
        },
        function testPlaylistFetch(client, callback) {
            client.makeRequest('getPlaylists', function(err, results) {
                callback(err);
            });
        }
    ], function(err) {
        if (err) {
            if (err === cheatingAuth) {
                res.redirect('/rdio_linked.html');
            } else {
                res.render('error', {unknownErr: err});
            }
        } else {
            res.cookie('rdioLink', true, {path: '/', maxAge: TWO_YEARS});
            if (req.query.return) {
                res.redirect(req.query.return);
            } else {
                res.redirect('/rdio_linked.html');
            }
        }
    }); 
}