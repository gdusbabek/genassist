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

* deep oauth integration
  1. go to /rdio_link?with_return_url
  2. that returns a URL, redirect them there.
  3. they click yes, get redirected to a new url

* save playlist
  1. do oauth in new window.
  2. go back to playlist window to enter pin
  3. save playlist.
 
* todo: need full oauth landing, etc. need to put this on a public space.
* deeper integration into last.fm, spotify, rdio, etc.

## If you get bored...

* region support for rdio.
* easy deployment to a new server.
* tooltips on the the playlist buttons

