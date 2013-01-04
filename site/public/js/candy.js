var images = [
  'http://www.dusbabek.org/~garyd/family.jpg',
  'http://www.dusbabek.org/~garyd/dus_fam.jpg',
  'http://www.dusbabek.org/~garyd/heart.jpg'
];

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

function showNextImage() {
    if (loadedImages.length === 0) {
        return;
    } else {
        index = (index + 1) % loadedImages.length;
        var img = loadedImages[index];
        if (!img) {
            return;
        }
        
        var windowHeight = $(window).height();
        var windowWidth = $(window).width();
        $('#bgimg').attr('src', img.src);
        $('#bgimg').attr('width', windowWidth);
        $('#bgimg').attr('height', windowHeight);
        
        jQuery.fn.fullscreenr({
            width: windowWidth,
            height: windowHeight,
            bgId: '#bgimg'
        });
    }
}

$(document).ready(function() {
    images.forEach(function(image) {
        fetchImage(image);
    });
    
    setInterval(showNextImage, 5000);
});
