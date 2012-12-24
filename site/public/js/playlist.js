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

function findSessionId() {
    return $('#sessionId').html();
}

function savePlaylist(sessionId) {
    sessionId = sessionId || findSessionId();
}

function toggleOptions() {
    $('#options-modal').modal({});
}

/*
tr(id="row_#{song.id}")
    td
        div(class="btn-group", id="song_action_menu_#{song.id}")
            a(class="btn btn-mini dropdown-toggle", data-toggle="dropdown", href="#")
                i(class="icon-cog")
                span(class="caret")
            ul(class="dropdown-menu")
                li
                    a(href="#", onclick="steer(null, 'more', '#{song.id}');")
                        i(class="icon-thumbs-up")
                        span  More like this
                li
                    a(href="#", onclick="steer(null, 'less', '#{song.id}');")
                        i(class="icon-thumbs-down")
                        span  Less like this (and remove)
                li
                    a(href="#", onclick="steer(null, 'remove', '#{song.id}');")
                        i(class="icon-remove")
                        span  Remove
        span.offset20  #{song.artist_name}
    td #{song.title}
    */
function formatPlaylistRow(song) {
    var str = '<tr id="row_' + song.id + '">' + 
    '<td>' + 
        '<div class="btn-group" id="song_action_menu_' + song.id + '">' +
            '<a class="btn btn-mini dropdown-toggle" data-toggle="dropdown" href="#">' +
                '<i class="icon-cog"/>' +
                '<span class="caret"/>' +
            '</a>' + 
            '<ul class="dropdown-menu">' +
                '<li><a href="#" onclick="steer(null, \'more\', \'' + song.id + '\');"><i class="icon-thumbs-up"/> <span> More like this</a>' +
                '<li><a href="#" onclick="steer(null, \'less\', \'' + song.id + '\');"><i class="icon-thumbs-down"/> <span> Less like this (and remove)</a>' +
                '<li><a href="#" onclick="steer(null, \'remove\', \'' + song.id + '\');"><i class="icon-remove"/> <span> Remove</a>' +
            '</ul>' +
        '</div>' +
    
    '<span class="offset20"> ' + song.artist_name + '</span>' +
    '</td>' +
    '<td>' + song.title + '</td>'
    '</tr>';
    return str;
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

function serverSteer(sessionId, direction, songId, callback) {
    $.get('/api/steer_session', {sessionId: sessionId, direction: direction, songId: songId}, function(json) {
        var obj = JSON.parse(json);
        if (obj.status !== 'error') {
            callback(null, obj.message);
        } else {
            callback(obj.message, null);
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

function steer(sessionId, direction, songId) {
    sessionId = sessionId || findSessionId();
    async.waterfall([
        function maybeSteer(callback) {
            if (direction !== 'remove') {
                serverSteer(sessionId, direction, songId, function(err, msg) {
                    if (err) {
                        callback(err, null);
                    } else {
                        callback(null, msg);
                    }
                });
            } else {
                callback(null, 'Removed, but did not affect generation.');
            }
        },
        function maybeRemove(msg, callback) {
            if (direction !== 'more') {
                $('#row_' + songId).remove();
            }
            callback(null, msg);
        }
    ], function(err, msg) {
        console.log(arguments);
        if (err) {
            $('#alert_string').text('Error:');
            $('#alert_message').text(err);
        } else {
            $('#alert_string').text('OK:');
            $('#alert_message').text(msg);
        }
        $('#alert').removeClass('hide alert-error alert-success').addClass('alert').addClass(err ? 'alert-error' : 'alert-success');
    });
}