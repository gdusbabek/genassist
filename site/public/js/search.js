/*global $, document, window */

function getQuery() {
    return encodeURIComponent($('#query').val());
}

function seedWith(echoSongId) {
    $.get('/seed', {songId: echoSongId, sinceYear: '1990'}, function(json) {
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
            $('#playlist').toggle();
        } else {
            alert('error :/');
        }
    });
}

function getOptionContent() {
    return $('#searchOptionsContent').html();
}

$(document).ready(function() {
    $('#btnAdvanced').popover({
        animation: false,
        placement: 'bottom',
        html: true,
        content: function() {
            return $('#searchOptionsContent').html();
        }
    });
    $('#searchSongBtn').click(function() {
        $.get('/search', {query: getQuery()}, function(json) {
            // filll up the table
            var songs = JSON.parse(json);
            if (songs.status !== 'error') {
                $('#candidate-table tbody').empty()
                songs.result.forEach(function(song) {
                    $('#candidate-table tbody').append('<tr onClick="seedWith(\'' + song.id + '\');"><td><a>' + song.artist + '</a></td><td><a>' + song.title + '</a></td></tr>');
                });
                // show it.
                // $('#candidates').toggle();
                $('#candidates-modal').modal({});
            } else {
                alert('error :/');
            }
        });
    });

});
