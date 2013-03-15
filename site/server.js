var express = require('express');
var app = express();
var async = require('async');
var rdio = require('../lib/rdio');
var echo = require('../lib/echo');
var util = require('../lib/util');
var settings = require('../lib/config').settings;
var middleware = require('./genassist_middleware');
var rdio_routes = require('./routes/rdio');
var lastfm_routes = require('./routes/lastfm');
var index_routes = require('./routes/index');
var api_routes = require('./routes/api');

app.configure('development', function() {
    if (!process.env.NODE_ENV) {
        process.env.NODE_ENV = 'development';
    }
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    console.log(settings);
});

app.configure('production', function() {
    app.use(express.errorHandler());
    
});

app.configure('staging', function() {
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure(function() {
    console.log('Environment is: ' + process.env.NODE_ENV);
    app.enable('trust proxy')
    app.set('view engine', 'jade');
    app.set('views', __dirname + '/views');
    app.set('view options', {layout: false});
    //app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.compress());
    app.use(middleware.set_context_cookie());
    app.use(middleware.shorten_context_id());
    app.use(middleware.move_lastfm_from_cookie());
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
    
});

app.get('/', index_routes.root);
app.get('/index.html', index_routes.root);
app.get('/cookies.html', index_routes.cookies);
app.get('/candy.html', index_routes.candy);
app.get('/seed.html', index_routes.seed);
app.get('/claim_context.html', index_routes.claimContext);
app.get('/sleeping.html', index_routes.sleeping);
app.get('/sleeping_results.html', index_routes.sleepingResults);

app.get('/rdio_register.html', rdio_routes.register);
app.get('/rdio_comeback.html', rdio_routes.comeback);
app.get('/rdio_linked.html', rdio_routes.linked_landing);

app.get('/lastfm_register.html', lastfm_routes.register);
app.get('/lastfm_comeback.html', lastfm_routes.comeback);
app.get('/lastfm_linked.html', lastfm_routes.linked_landing);


// json api methods
app.get('/api/steer_session', api_routes.steerSession);
app.get('/api/search', api_routes.search);
app.get('/api/seed', api_routes.seed);
app.get('/api/next_songs_in_session', api_routes.nextInSession);
app.get('/api/current_song', api_routes.currentSong);
app.get('/api/save_playlist', api_routes.savePlaylist);
app.get('/api/scrobble', api_routes.scrobble);
app.get('/api/is_loved', api_routes.isSongLoved);
app.get('/api/fetch_similars', api_routes.fetchSimilars);

app.listen(settings.APP_PORT, settings.APP_HOST);
console.log('Listening on ' + settings.APP_HOST + ':' + settings.APP_PORT);

module.exports = app;