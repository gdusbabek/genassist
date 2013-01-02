# Playlist generator website

## Plans

### First iteration

1. You enter in the name of the song
2. Conduct a search, let the user show his preference
    * select a song, then generate a popup asking:
        * number of songs
        * date preference
3. Generate
    * regenerate
5. Save

Skinning the UI will take some work.  Resist the urge to do this first. Get things working, then futz with the UI.

### Later

* Playback. This will be easy for Rdio.
* Crawler that searches for songs. 
* Turn those into a playlist somehow.

Playlistica?

## Dependencies

The echonost dependency has been hacked to add support to the newer dynamic playlist API.

## Currently working on...

* pretty rdio landing page
* pretty save popup
* a staging deploy
* export keys into node user env.
  * server will probably need to read from resource file or something.
* uncaught exception
* package.json "install"
* deeper integration into last.fm, spotify, rdio, etc.

## If you get bored...

* region support for rdio.
* easy deployment to a new server.
* tooltips on the the playlist buttons
* secure storage of access tokens

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
