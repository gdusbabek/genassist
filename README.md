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

* Need a cleaner model of DbFromPath.
* In the process of making RelatedDb.fromPath generic enough to be used by all databases.

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

## Installing (New - with chef yo!)

After your server is set up, you need to get it happy with chef.
    
    sudo apt-get -y update
    sudo apt-get -y upgrade
    sudo apt-get -y install ruby-full gem rake git-core make build-essential
    sudo /usr/bin/gem install chef ohai --no-rdoc --no-ri

Then from your dev environment, it is simple:
    
    cd cms
    ./make_bundle.sh && ./deploy.sh user@host
