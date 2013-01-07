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

* eye candy
  * underlay or color oppositing for eye candy text.
* play now
* prettier cookie page
* uncaught exception
* deeper integration into last.fm, spotify, rdio, etc.

## If you get bored...

* a page that fetches images while you have music playing.
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
