# Playlist generator website

## Plans

### First iteration

The first iteration included simply generating a playlist and saving it.  This work is done.

### Later

* Playback. This will be easy for Rdio.
* Crawler that searches for songs. 
* Turn those into a playlist somehow.
* Make the UI suck less.

Playlistica?

## Dependencies

The echonost dependency has been hacked to add support to the newer dynamic playlist API.

## Currently working on...

* db upgrade is broke on a brand new database (sees 5 cols, expects 3 cols).
* refactor TWO_YEARS as settings concept.
* promoting uses minified JS libraries.
* use gzip
* get the req, res stuff out of my echo lib.
* play now
* prettier cookie page
* uncaught exception
* nightly summary of all errors in current log.

## If you get bored...

* staging and prod seem to be sharing a cookie space. The only way to fix this will be to use different host names.
* sanity tests for staging and production deploys.
* region support for rdio.
* easy deployment to a new server.
* tooltips on the the playlist buttons
* secure/encrypted storage of access tokens

## Installing

    sudo adduser --system --shell /bin/bash --gecos 'for running node.js apps' --group --disabled-password --home /home/node node
    sudo apt-get update
    sudo apt-get upgrade
    sudo apt-get install python-software-properties rake
    sudo add-apt-repository ppa:chris-lea/node.js
    sudo add-apt-repository ppa:nginx/stable
    sudo apt-get update
    sudo apt-get install nodejs npm nginx
    sudo apt-get install git-core make build-essential
    sudo apt-get install sqlite3 libsqlite3-dev
