/*global $, document, window */

function showContainer(which, visible) {
    $(which).removeClass().addClass(visible ? 'container' : 'hide');
}

function getQuery() {
    return encodeURIComponent($('#query').val());
}

function seedWith(echoSongId) {
    $.get('/seed', {songId: echoSongId}, function(json) {
        var obj = JSON.parse(json),
            sessionId, songs;
        if (obj.status !== 'error') {
            sessionId = obj.result.sessionId;
            songs = obj.result.songs;
            console.log(json);

            // build the playlist table.
            $('#playlist-table tbody').empty();
            // build the playlist table.
            /*{ artist_id: 'ARCOSZO1241B9C4043',
                id: 'SOAIGVP1311AFDB93A',
                artist_name: 'O Children',
                title: 'Ruins' },*/
            songs.forEach(function(song) {
                $('#playlist-table tbody').append('<tr><td>' + song.artist_name + '</td><td>' + song.title + '</td></tr>');
            });
            showContainer('#playlist', true);
        } else {
            alert('error :/');
        }
    });
}

$(document).ready(function() {
    $('#searchSongBtn').click(function() {
        $.get('/search', {query: getQuery()}, function(json) {
            // filll up the table
            var songs = JSON.parse(json);
            if (songs.status !== 'error') {
                $('#candidate-table tbody').empty()
                songs.result.forEach(function(song) {
                    $('#candidate-table tbody').append('<tr><td><button id="' + song.id + '" onClick="seedWith(\'' + song.id + '\');">this one</button></td><td>' + song.artist + '</td><td>' + song.title + '</td></tr>');
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
