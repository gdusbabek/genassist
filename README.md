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

* on 'less like this' do:
  1. highlight the row (pink or something like that)
  2. do the server side work.
  3. replace the row with a message.
  4. remove the row.
* on 'more like this' do:
  1. highlight thr row (pink or something like that)
  2. do the server side work.
  3. replace with a message.
* change where the steer message appears.  A slide-thru thing that stays up for 3 seconds would be fine.
* save playlist, will beget...
* deeper integration into last.fm, spotify, rdio, etc.

## If you get bored...

* tooltips on the the playlist buttons

