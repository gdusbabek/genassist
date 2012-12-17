/*
cd node_modules/echonest
npm install
rake build
*/

var echonest = require('echonest');

var params = {
    api_key: process.env.ECHO_KEY,
    consumer_key: process.env.ECHO_CONSUMER,
    secret: process.env.ECHO_SECRET
};

var nest = new echonest.Echonest(params);

// nest.playlist.dynamic
console.log(nest.playlist.dynamic);