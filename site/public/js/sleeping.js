

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
  var query = '?';
  
  // determine millis.
  // which button is hot?
  var millis = 7 * 24 * 60 * 60 * 1000;
  if ($('#new-since-last-btn').attr('class').indexOf('active') >= 0) {
    var lastVisitStr = $('#last-visit').text();
    var lastVisitMillis = parseInt($('#last-visit-millis').text(), 10);
    if (lastVisitStr !== 'Never') {
      // it will be in mm/dd/yyyy format.
      // max it out at 5 weeks.
      millis = Math.min(5 * millis, Date.now() - lastVisitMillis);
      console.log(millis);
    } // else leave it at 7 days.
  } else if ($('#new-since-date-btn').attr('class').indexOf('active') >= 0) {
    millis = Date.now() - Date.parse($('#specific-date-field').val());
    if (millis < 0) {
      // can't diff the future.
      millis = 7 * 24 * 60 * 60 * 1000;
    }
  } else if ($('#new-since-days-btn').attr('class').indexOf('active') >= 0) {
    millis = Math.min(parseInt($('#specific-days-field').val(), 10), 35) * 24 * 60 * 60 * 1000;
  } else {
    return;
  }
  query += 'millis=' + millis;
  
  // artists.
  if (selectedArtists.length > 0) {
    query += '&artists=' + encodeURIComponent(selectedArtists.join(','));
  }
  
  // rdio user
  var rdioUser = $('#specific-rdio-user').val();
  if (rdioUser.length > 0) {
    query += '&rdioUser=' + encodeURIComponent(rdioUser);
  }
  
  // last user.
  var lastfmUser = $('#specific-lastfm-user').val();
  if (lastfmUser.length > 0) {
    query += '&lastfmUser=' + encodeURIComponent(lastfmUser);
  }
  
  // redirect.
  // window.location.href
  document.location.href = '/sleeping_results.html' + query;
}

$(document).ready(function() {
  
  // init the datepicker
//  $('.datepicker').datepicker();
  $('#specific-date-field').datepicker();
  
  $('#specific-artists-modal').on('hide', function() {
    $('#specific-artists').html(selectedArtists.join(', '));
    $.get('/api/fetch_similars', {
      artists: selectedArtists.join(','),
      async: true
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