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

* database upgrades should not be performed by the application. they __must__ happen while the app is offline.
  *  The process should be:
    *  shutdown
    *  back up database files
    *  perform upgrade
    *  if error, restore files
    *  else all is good.
* while you were sleeping...
  * better way of dumping
  * rate limiting sucks.
  * generate echo artists from a list of artist names (get from real).
  * figure out what is calling causing: { [Error: SQLITE_CONSTRAINT: column albumId is not unique] errno: 19, code: 'SQLITE_CONSTRAINT' }
  
* refactor TWO_YEARS as settings concept.
* promoting uses minified JS libraries.
* use gzip
* get the req, res stuff out of my echo lib.
* play now
* prettier cookie page
* uncaught exception
* nightly summary of all errors in current log.

## If you get bored...

* need a fake-echonest module.
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

# The Case for a Common Service Registry

## Motivation

As enterprises develop and deploy an ever-increasing amount a services, cataloging and discovering them becomes a challenge. 

## Emerging Patterns

Users want several things out of a service registry:

* A way to store and publish service and related metadata including service "aliveness".
* A way to store and publish general configuration values.
* Event notifications on service lifecycle events.
* A means for discovery

## Rackspace Service Registry

Rackspace has built a service registry aimed at satisfying these needs for internal and external customers.
We are in the process of making parts of it open source.

Some interesting problems we have tackled:

* Is it better to have a fully-documented public API or supply high-quality open source idiomatic client libraries?
* Deciding on optimizing for writes (constantly heartbeating services) or reads (retrieving data).  Why we chose writes.
* Managing expectitions around locking (why "this distributed stuff" is hard) 

There are still many open questions as demonstrated by proliferation of registry-like projects.
Studying the mechanics of our service registry will help inform other engineers.
They will benefit by learning from our mistakes and observations.
