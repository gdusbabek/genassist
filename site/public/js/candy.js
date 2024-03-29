var IMAGE_SHOW_TIME = 10000;

var images = [
  'http://www.dusbabek.org/~garyd/dus_fam.jpg'
];

var curSong = '';
var curArtist = '';
var curArtistKey = '';
var curSongKey = '';
var index = 0;
var loadedImages = [];
var animating = true;
var lastSongChangedAt = Date.now();
var imgLoadInterval;
var STALE_IMAGE_TIMEOUT = 10 * 60 * 1000;

function fetchImage(src) {
    var img = new Image();
    img.onload = function() {
        console.log('loaded image');
        loadedImages.push(this);
    };
    img.src = src;
} 

var optIndex = 0;
var opts = [
    { bottom: '-=250'},
    { bottom: '+=250', left: '-=250'},
    { bottom: '-=250'},
    { bottom: '+=250', left: '+=250'}
];

// dunno what the license is, but I copied this function from StackOverflow.
// http://stackoverflow.com/posts/901144/revisions
function getParameterByName(name) {
  name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
  var regexS = "[\\?&]" + name + "=([^&#]*)";
  var regex = new RegExp(regexS);
  var results = regex.exec(window.location.search);
  if(results == null)
    return "";
  else
    return decodeURIComponent(results[1].replace(/\+/g, " "));
}

function moveImage() {
  if (!animating) {
    return;
  } else {
    $('#bgimg').animate(opts[optIndex], IMAGE_SHOW_TIME, 'swing', moveImage);
    optIndex = (optIndex + 1) % opts.length;
  }
}

function showNextImage() {
    if (Date.now() - lastSongChangedAt > STALE_IMAGE_TIMEOUT) {
      return;
    } else if (loadedImages.length === 0) {
        return;
    } else {
        index = (index + 1) % loadedImages.length;
        var img = loadedImages[index];
        if (!img) {
            return;
        }
        
        var windowHeight = Math.round($(window).height() * 1.5);
        var windowWidth = Math.round($(window).width() * 1.5);
        $('#bgimg').attr('src', img.src);
        $('#bgimg').attr('width', windowWidth);
        $('#bgimg').attr('height', windowHeight);
        
        jQuery.fn.fullscreenr({
            width: windowWidth,
            height: windowHeight,
            bgId: '#bgimg'
        });
        $('#bgimg').css('height', 'auto');
        $('#bgimg').css('max-width', windowWidth);
        $('#bgimg').css('width', windowWidth);
        $('#bgimg').css('bottom', '-200px');
    }
}

function scrobble(which) {
    console.log('scrobbling');
    $.get('/api/scrobble', {
        artist: curArtist,
        song: curSong,
        which: which
    }, function(json) {
        var obj = JSON.parse(json);
        if (obj.status === 'ok') {
            if (which === 'love') {
                $('#last_unlove').removeClass('hide');
                $('#last_love').addClass('hide');
            } else {
                $('#last_unlove').addClass('hide');
                $('#last_love').removeClass('hide');
            }
        } else {
            console.log(obj);
        }
    });
}

function maybeLoadNewImages() {
    var songStaleness = (Date.now() - lastSongChangedAt);
    if (songStaleness > STALE_IMAGE_TIMEOUT) {
      $('#stagnation').removeClass('hide');
      clearInterval(imgLoadInterval);
      animateStop();
      return;
    }
    $.get('/api/current_song', {curArtistKey: curArtistKey, curSongKey: curSongKey}, function(json) {
        var response = JSON.parse(json);
        if (response.status === 'error') {
            console.log(json);    
        } else {
            $('#songName').text(response.result.song);
            $('#artistName').text(response.result.artistName);
            
            // changes in response to new artist.
            if (response.result.artistKey === curArtistKey) {
                console.log('artist did not change');
            } else {
                console.log('will load new images');
                curArtistKey = response.result.artistKey;
                curArtist = response.result.artistName;
                loadedImages = [];
                index = 0;
                response.result.images.forEach(function(url) {
                    fetchImage(url);
                });
            }
            
            // changes in response to new song.
            if (response.result.songKey !== curSongKey) {
                lastSongChangedAt = Date.now();
                curSong = response.result.song;
                curSongKey = response.result.songKey;
                if ($.cookie('lastLink')) {
                    var isLoved = response.result.isLoved || false;
                    if (isLoved) {
                        $('#last_unlove').removeClass('hide');
                        $('#last_love').addClass('hide');
                    } else {
                        $('#last_unlove').addClass('hide');
                        $('#last_love').removeClass('hide');
                    }
                }
            }
        }
    });
}

function resumeImages() {
  $('#stagnation').addClass('hide');
  lastSongChangedAt = Date.now();
  setTimeout(maybeLoadNewImages, 1);
  imgLoadInterval = setInterval(maybeLoadNewImages, 30000);
  animateResume();
}

function animateStop() {
  animating = false;
  $('#bgimg').stop();
  $('#ani_stop').addClass('hide');
  $('#ani_start').removeClass('hide');
}

function animateResume() {
  console.log('resuming animation');
  animating = true;
  $('#ani_start').addClass('hide');
  $('#ani_stop').removeClass('hide');
  moveImage();
}

$(document).ready(function() {
    if ($.cookie('rdioLink')) {
        images.forEach(function(image) {
            fetchImage(image);
        });
        
        setInterval(showNextImage, IMAGE_SHOW_TIME);
        setTimeout(maybeLoadNewImages, 1); // to quickly show new stuff.
        imgLoadInterval = setInterval(maybeLoadNewImages, 30000); // repeats forever.
        moveImage();
        
        if ($.cookie('lastLink')) {
            $('#lastfm_controls').removeClass('hide');
        }
      
        $('#ani_stop').removeClass('hide');
        
    } else {
        $('#song_info').addClass('hide');
        $('#rdio_missing').removeClass('hide');
        $('#floating_controls').addClass('hide');
    }
});
