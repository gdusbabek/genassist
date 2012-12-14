/*global $, document, window */

function showContainer(which, visible) {
    $(which).removeClass().addClass(visible ? 'container' : 'hide');
}

function getQuery() {
    return encodeURIComponent($('#query').val());
}

$(document).ready(function() {
    $('#rdioBtn').click(function() {
        $.get('/search', {query: getQuery(), service: 'rdio'}, function(result) {
            // dynamically build a table
        });
    });

    $('#spotifyBtn').click(function() {
        $.get('/search', {query: getQuery(), service: 'spotify'}, function(result) {
            // dynamically build a table.
        });
    });
});
