/*global $, document, window */

function getQuery() {
    return encodeURIComponent($('#query').val());
}

function showOptions() {
    $('#options-modal').modal({});
}

// callback expects(err, songs)
function searchCandidates(query, callback) {
    $.get('/api/search', {query: query}, function(json) {
        var songs = JSON.parse(json);
        if (songs.status == 'error') {
            console.log(json);
            callback('Candidate search error', null);
        } else {
            callback(null, songs.result);
        }
    });
}

// callback expects(err)
function populateCandidates(songs, callback) {
    var sinceYear = $('#sinceYear').val() || '1990',
        service = 'RDIO'; //$("#service-radios input[type='radio']:checked").val() || 'NONE';
    $('#candidate-table tbody').empty()
    songs.forEach(function(song) {
        $('#candidate-table tbody').append('<tr><td><a class="btn btn-mini" id="candidate_' + song.id + '" href="/seed.html?songId=' + song.id +'&sinceYear=' + sinceYear + '&songName=' + song.title + '&service=' + service + '"><i class="icon-headphones"/> yes!</a></td><td>' + song.artist + '</td><td>' + song.title + '</td></tr>');
    });
    callback(null);
}

function onSearchClick() {
    async.waterfall([
        searchCandidates.bind(null, getQuery()),
        populateCandidates.bind(null),
        function showCandidates(callback) {
            $('#candidates-modal').modal({});
            callback(null);
        }
    ], 
    function(err) {
        if (err) {
            console.log('there was an error');
            console.log(arguments);
            alert(err);
        }
    });
}

$(document).ready(function() {
    // arm the search button.
    $('#searchSongBtn').click(onSearchClick);
});
