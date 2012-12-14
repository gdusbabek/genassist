var express = require('express');
var app = express();

app.configure(function() {
	app.set('view engine', 'jade');
	app.set('views', __dirname + '/views');
	app.set('view options', {layout: false});
	//app.use(express.bodyParser());
	//app.use(express.cookieParser());
	//app.use(app.router);
	console.log(__dirname + '/public');
	app.use(express.static(__dirname + '/public'));
});
	
// routes are here.

app.get('/example.1', function(req, res) {
	var body = 'Example 1';
	res.setHeader('Content-Type', 'text/plain');
	res.setHeader('Content-Length', body.length);
	res.end(body);
});

app.get('/example.2', function(req, res) {
	res.send('Example 2');
});

app.get('/index.html', function(req, res) {
    var params = {
        title: 'Build a playlist',
        query: {
            text: 'Friday I\'m in Love The Cure'
        }
    };
	res.render('index', params);
});

app.get('/search', function(req, res) {
    res.send('Search for ' + req.query.query);
});

app.listen(2000);
console.log('Listening on ' + 2000);

module.exports = app;