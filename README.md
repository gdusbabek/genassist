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

* lastfm integration is broken.
* refactor TWO_YEARS as settings concept.
* promoting uses minified JS libraries.
* use gzip
* get the req, res stuff out of my echo lib.
* play now
* prettier cookie page
* uncaught exception
* nightly summary of all errors in current log.

## If you get bored...

* do not save contexts for spiders/crawlers.
* log daemons to an irc channel.
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
    sudo mkdir -p /opt/genassist/uploads
    gdusbabek@playlistica:/home/node$ sudo chown -R user:user /opt/genassist/

Then from your dev environment, it is simple:
    
    cd cms
    ./make_bundle.sh && ./deploy.sh user@host

## Importing the new database.

    sqlite3 production.db
    delete from contexts where rdioObj='{}' and lastObj='{}' and lastsk is NULL and lastUser is NULL;
    .mode insert
    .out production.sql
    select * from contexts;
    .quit
