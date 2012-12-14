/*global $, document, window */

function showContainer(which, visible) {
    $(which).removeClass().addClass(visible ? 'container' : 'hide');
}

function getQuery() {
    return encodeURIComponent($('#query').val());
}

$(document).ready(function() {
    $('#rdioBtn').click(function() {
        $.get('/search', {query: getQuery(), service: 'rdio'}, function(json) {
            // filll up the table
            var songs = JSON.parse(json);
            if (songs.status !== 'error') {
                $('#candidate-table tbody').empty()
                songs.result.forEach(function(song) {
                    $('#candidate-table tbody').append('<tr><td>' + song.artist + '</td><td>' + song.name + '</td></tr>');
                });
                // show it.
                showContainer('#candidates', true);
            } else {
                alert('error :/');
            }
        });
    });

    $('#spotifyBtn').click(function() {
        $.get('/search', {query: getQuery(), service: 'spotify'}, function(result) {
            // dynamically build a table.
        });
    });
});
