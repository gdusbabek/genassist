#! /usr/local/bin/node

var rlib = require('../lib/rdio');
var r = rlib.getAuthRdio('http://localhost:2000/rdio_comeback.html');

// Make an authenticated request (with OAuth flow)
r.beginAuthentication(function(error, loginUrl) {
    if (error) {
      console.log(error);
      return;
    }

    var stdin = process.stdin, stdout = process.stdout;

    stdin.resume();
    stdout.write('visit: ' + loginUrl + '\nEnter your pin: ');

    stdin.once('data', function(data) {
      data = data.toString().trim();
      r.completeAuthentication(data, function() {

        // Notice how unlike the call to 'search' above,
        // 'getPlaylists' doesn't need any parameters.
        r.makeRequest('getPlaylists', function() {
          console.log(arguments[1]);
          process.exit();
        });
      });
    });
  }
);