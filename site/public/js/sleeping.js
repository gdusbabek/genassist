

var selectedArtists = [];

function addSpecificArtist() {
  var artistName = $('#artist-to-add').val();
  var added = addSpecificArtistToTable(artistName);
  if (added) {
    $('#artist-to-add').val('');
  }
}

function removeSpecificArtist(rowIndex) {
  selectedArtists.splice(rowIndex, 1);
  $('#artist-table-row-' + rowIndex).remove();
}

function addSpecificArtistToTable(name) {
  if (selectedArtists.indexOf(name) >= 0) { return false; }
  // add a row to the table.
  var rowIndex = selectedArtists.length,
      rowId = 'artist-table-row-' + rowIndex;
  selectedArtists.push(name);
  $('#artist-table').append('<tr id="' + rowId + '"><td><div><button class="btn btn-mini" onclick="removeSpecificArtist(' + rowIndex + ');"><i class="icon-remove"/></button></div></td><td>' + name + '</td></tr>');
  return true;
}

function showSince(div) {
  var allDivs = ['new-since-last-div', 'new-since-date-div', 'new-since-days-div'];
  allDivs.forEach(function(d) {
    if (d === div) {
      $('#' + d).removeClass('hide');
    } else {
      $('#' + d).addClass('hide');
    }
  });
}

function getResults() {
  // collect the artists.
  // determine millis.
  // contact the api.
  // redirect.
}

$(document).ready(function() {
  
  // init the datepicker
//  $('.datepicker').datepicker();
  $('#specific-date-field').datepicker();
  
  $('#specific-artists-modal').on('hide', function() {
    $('#specific-artists').html(selectedArtists.join(', '));
    $.get('/api/fetch_similars', {
      artists: selectedArtists.join(','),
      async: false
    }, function(json) {
      // todo: at some point, turn async off and use this data.
      console.log(json);
    });
  });
  $('#artist-to-add').bind('keyup', function(ev) {
      if (ev.keyCode === 13 /* CR */) {
        addSpecificArtist();
      }
  });
  
  $('#specific-rdio-user-modal').on('hide', function() {
    var user = $('#specific-rdio-user').val();
    $('#rdio-user').html(user);
    $.get('/api/fetch_similars', {
      user: user,
      service: 'rdio',
      async: true
    }, function(json) {
      // todo: at some point, turn async off and use this data.
    });
  });
  $('#specific-rdio-user').bind('keyup', function(ev) {
    if (ev.keyCode === 13) {
      $('#specific-rdio-user-modal').modal('hide');
    }
  });
  
  $('#specific-lastfm-user-modal').on('hide', function() {
    var user = $('#specific-lastfm-user').val();
    $('#lastfm-user').html(user); 
    $.get('/api/fetch_similars', {
      user: user,
      service: 'lastfm',
      async: true
    }, function(json) {
      // todo: at some point, turn async off and use this data.
    });
  });
  $('#specific-lastfm-user').bind('keyup', function(ev) {
    if (ev.keyCode === 13) {
      $('#specific-lastfm-user-modal').modal('hide');
    }
  });
  $('#new-since-last-btn').click();
});