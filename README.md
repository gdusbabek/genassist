# Playlist generator website

## Dependencies

* The echonost dependency has been hacked to add support to the newer dynamic playlist API.
* Fermata has been hacked to return headers and http status code as response metadata.

### Completed Parts

* The first iteration included simply generating a playlist and saving it.  This work is done.
* The second iteration involved
  * A new music crawler (source is Rdio releases)
  * Code to find new releases similar to specified artists.
  * Supporting web page.
  * Switching to chef for deployment. Woo!

## Plans

### Later

* Playback. This will be easy for Rdio. 
* Turn new music into a playlist.
* Make the UI suck less.

Playlistica?  Genassist?

## Currently working on...

* refactor TWO_YEARS as settings concept.
* promoting uses minified JS libraries.
* use gzip
* play now
* prettier cookie page
* uncaught exception
* nightly summary of all errors in current log.

## If you get bored...

* make a branch that uses an AWS datastore.
* do not save contexts for spiders/crawlers.
* log daemons to an irc channel.
* sanity tests for staging and production deploys.
* region support for rdio.
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
