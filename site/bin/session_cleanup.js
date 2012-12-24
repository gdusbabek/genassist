#! /usr/local/bin/node

var echonest = require('echonest');

var params = {
    api_key: process.env.ECHO_KEY,
    consumer_key: process.env.ECHO_CONSUMER,
    secret: process.env.ECHO_SECRET
};

var sessionId = process.argv[2];

var nest = new echonest.Echonest(params);
nest.playlist.dynamic['delete']({
    session_id: sessionId,
    format: 'json'
}, function(err, res) {
    if (err) {
        console.log('Problem removing ' + sessionId + '  ' + err.toString());
    } else {
        console.log(res.status.message + ' ' + sessionId + ' was removed');
    }
});