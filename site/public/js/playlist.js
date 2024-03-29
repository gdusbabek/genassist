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

function toggleSave() {
    if (!$.cookie('rdioLink')) {
        // todo: prettier error
        alert('rdio not linked');
    } else {
        $('#save-modal').modal({});
    }
}

function formatPlaylistRow(song) {
    var str = '<tr id="row_' + song.id + '" songId="' + song.id + '" service="' + song.foreign_service + '" foreignId="' + song.foreign_id + '">' + 
    '<td>' + 
        '<div class="btn-group">' +
            '<button class="btn btn-mini" onclick="steer(null, \'more\', \'' + song.id + '\');"><i class="icon-thumbs-up"/></button>' + 
            '<button class="btn btn-mini" onclick="steer(null, \'less\', \'' + song.id + '\');"><i class="icon-thumbs-down"/></button>' + 
            '<button class="btn btn-mini" onclick="steer(null, \'remove\', \'' + song.id + '\');"><i class="icon-remove"/></button>' + 
        '</div>' +
    '</td>' +
    '<td>' + song.artist_name + '</td>' +
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

// callback expects(error, SMR)
function serverSavePlaylist(playlistName, songs, sessionId, callback) {
    $.get('/api/save_playlist', {playlistName: playlistName, songs: songs, sessionId: sessionId}, function (json) {
        var response = JSON.parse(json);
        if (response.status === 'error') {
            callback(new Error(response.message));
        } else {
            callback(null, response)
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
                $('#playlist_table tbody').append(formatPlaylistRow(song));
            });
            $('#options-modal').modal('hide');
        }
    });
}

function steer(sessionId, direction, songId) {
    var originalRowContents, service, foreignId, message = '';
    sessionId = sessionId || findSessionId();
    if (direction === 'more') {
        message = 'Steering generator toward this song.';
    } else if (direction === 'less') {
        message = 'Steering generate away from this song.';
    } else if (direction === 'remove') {
        message = 'Removing form playlist without steering the generator';
    }
    async.waterfall([
        function installMarkerRow(callback) {
            originalRowContents = $('#row_' + songId).html();
            service = $('#row_' + songId).attr('service');
            foreignId = $('#row_' + songId).attr('foreignid');
            $('#row_' + songId).replaceWith('<tr id="row_' + songId + '"><td colspan="3">' + message + '</td></tr>');
            $('#row_' + songId).addClass('info');
            callback(null);
        },
        function maybeSteer(callback) {
            if (direction !== 'remove') {
                serverSteer(sessionId, direction, songId, function(err, msg) {
                    callback(null, {err: err, msg: msg});
                });
            } else {
                callback(null, {err: null, msg: 'Removed, but did not affect generation.'});
            }
        },
        function displayResults(status, callback) {
            $('#row_' + songId).removeClass('info');
            if (status.err) {
                message = status.err;
                $('#row_' + songId).replaceWith('<tr id="row_' + songId + '"><td colspan="3">' + message + '</td></tr>');
                $('#row_' + songId).addClass('error');
            } else {
                $('#row_' + songId).addClass('success');
            }
            setTimeout(function(){
                callback(null, status);
            }, 750);
        },
        function maybeRemove(msg, callback) {
            if (direction !== 'more') {
                $('#row_' + songId).remove();
            } else {
                // hmm. not entirely correct.
                $('#row_' + songId).replaceWith('<tr id="row_' + songId + '" songId="' + songId + '" service="' + service + '" foreignId="' + foreignId + '">' + originalRowContents + '</tr>');
                $('#row_' + songId).removeClass('info');
            }
            callback(null);
        }
    ], function(err) {
        
        //$('#alert').removeClass('hide alert-error alert-success').addClass('alert').addClass(err ? 'alert-error' : 'alert-success');
    });
}

function savePlaylist() {
    var playlistName = $('#playlist_name').val(),
        songs = [],
        sessionId = $('#sessionId').html();
    
    if (!$.cookie('rdioLink')) {
        // todo: prettier error
        alert('rdio not linked');
    } else {
    
        $('#playlist_table > tbody  > tr').each(function(index, row) {
            songs.push({
                songId: $(this).attr('songid'),
                foreignId: $(this).attr('foreignid')
            });
        });
        serverSavePlaylist(playlistName, songs, sessionId, function(err, smr) {
            if (err) {
                console.log(err);
                alert(err);
            } else {
                // make the playlist popup go away.
                $('#save-modal').modal('hide');
                // populate the playlist div
                // show it.
                $('#playlist-link').attr('href', smr.result.shortUrl);
                $('#playlist-icon-link').attr('href', smr.result.shortUrl);
                $('#playlist-caption').text(smr.result.shortUrl);
                $('#playlist-link').text(playlistName);
                $('#your-playlist').text(playlistName);
                $('#playlist-icon').attr('src', smr.result.icon);
                $('#playlist-links').removeClass('hide');
                
                // remove the moar button
                $('#moar-btn').addClass('hide');
                $('#savePlaylistModalBtn').addClass('hide');
                
                // and the button tds.
                $("#playlist_table tbody tr td:first-child").each(function(){
                    $(this).replaceWith('<td></td>');
                });
                
            }
        });
    }
}

$(document).ready(function() {
    
    if (!$.cookie('rdioLink')) {
        $('#savePlaylistModalBtn').addClass('disabled');
    }
});