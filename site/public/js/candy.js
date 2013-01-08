var IMAGE_SHOW_TIME = 10000;

var images = [
  'http://www.dusbabek.org/~garyd/dus_fam.jpg'
];

var curArtistKey = '';
var index = 0;
var loadedImages = [];

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

function moveImage() {
    $('#bgimg').animate(opts[optIndex], IMAGE_SHOW_TIME, 'swing', moveImage);
    optIndex = (optIndex + 1) % opts.length;
}

function showNextImage() {
    if (loadedImages.length === 0) {
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

function maybeLoadNewImages() {
    $.get('/api/current_song', {curArtistKey: curArtistKey}, function(json) {
        var response = JSON.parse(json);
        if (response.status === 'error') {
            console.log(json);    
        } else {
            $('#songName').text(response.result.song);
            $('#artistName').text(response.result.artistName);
            if (response.result.artistKey === curArtistKey) {
                console.log('artist did not change');
            } else {
                console.log('will load new images');
                curArtistKey = response.result.artistKey;
                loadedImages = [];
                index = 0;
                response.result.images.forEach(function(url) {
                    fetchImage(url);
                });
            }
        }
    });
}

$(document).ready(function() {
    if ($.cookie('rdioLink')) {
        images.forEach(function(image) {
            fetchImage(image);
        });
        
        setInterval(showNextImage, IMAGE_SHOW_TIME);
        setTimeout(maybeLoadNewImages, 1); // to quickly show new stuff.
        setInterval(maybeLoadNewImages, 30000); // repeats forever.
        moveImage();
    } else {
        $('#song_info').addClass('hide');
        $('#rdio_missing').removeClass('hide');
    }
});
