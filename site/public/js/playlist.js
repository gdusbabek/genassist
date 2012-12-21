// not used.
function seedWith(echoSongId) {
    $.get('/api/seed', {songId: echoSongId, sinceYear: '1990'}, function(json) {
        var obj = JSON.parse(json),
            sessionId, songs;
        if (obj.status !== 'error') {
            sessionId = obj.result.sessionId;
            songs = obj.result.songs;

            // build the playlist table.
            $('#playlist-table tbody').empty();
            // build the playlist table.
            /*{ artist_id: 'ARCOSZO1241B9C4043',
                id: 'SOAIGVP1311AFDB93A',
                artist_name: 'O Children',
                title: 'Ruins' },*/
            songs.forEach(function(song) {
                $('#playlist-table tbody').append(formatPlaylistRow(song));
            });
            $('#playlist').toggle();
        } else {
            alert('error :/');
        }
    });
}

// helpers.

function savePlaylist(sessionId) {
    sessionId = sessionId || findSessionId();
}

function toggleOptions() {
    $('#options-modal').modal({});
}

function formatPlaylistRow(song) {
    return '<tr><td>' + song.artist_name + '</td><td>' + song.title + '</td></tr>';
}

// contacts the server, gets json, converts to objects.
function serverAddSongs(numSongs, sessionId, callback) {
    $.get('/api/next_songs_in_session', {sessionId: sessionId, numSongs: numSongs}, function(json) {
        var obj = JSON.parse(json);
        if (obj.status !== 'error') {
            callback(null, obj.result.songs);
        } else {
            callback(obj.result, null);
        }
    });
}

// called when addSongs button is clicked.
function addSongs(numSongs, sessionId) {
    if (numSongs === undefined) {
        // get it from the input box.
        numSongs = parseInt($('#numSongsToAdd').val());
    }
    if (sessionId === undefined) {
        sessionId = $('#sessionId').html();
    }
    // todo: ui entertainment.
    serverAddSongs(numSongs, sessionId, function(err, songs) {
        if (err) {
            alert('Error adding songs');
        } else {
            songs.forEach(function(song) {
                $('#playlist-table tbody').append(formatPlaylistRow(song));
            });
            $('#options-modal').modal('hide');
        }
    });

}