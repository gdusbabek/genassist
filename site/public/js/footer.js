

$(document).ready(function() {
    if ($.cookie('rdioLink')) {
        $('#is_not_rdio').addClass('hide');
    } else if ($('#hide_rdio_invitation_in_footer').length > 0) {
        $('#is_not_rdio').addClass('hide');
    }
    
    if ($.cookie('lastLink')) {
        $('#is_not_last').addClass('hide');
    } else if ($('#hide_last_invitation_in_footer').length > 0) {
        $('#is_not_last').addClass('hide');
    } else {
        // todo: decorate the link with a callback to this page.
        
    }
});