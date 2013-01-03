

$(document).ready(function() {
    if ($.cookie('rdioLink')) {
        $('#is_not_rdio').addClass('hide');
    } else if ($('#hide_rdio_invitation_in_footer').length > 0) {
        $('#is_not_rdio').addClass('hide');
    }
});