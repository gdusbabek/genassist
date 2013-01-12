
function setCookie(key, value) {
    if (value === '!!CLEAR') {
        $.removeCookie(key  , { path: '/' });
    } else {
        $.cookie(key, value, { expires: 60, path: '/' });
            
    }
    displayAllCookies();
}

function showCookieValue(cookie, element) {
    var value = $.cookie(cookie);
    if (value === null || value === undefined) {
        value = "cookie is not set";
    }
    $('#' + element).text(value);
}

function displayAllCookies() {
    var showThese = [
        ['service', 'currentService'],
        ['context', 'context'],
        ['rdioLink', 'rdioLink'],
        ['lastLink', 'lastLink'],
        ['lastUser', 'lastUser']
    ];

    showThese.forEach(function(tuple) {
        showCookieValue(tuple[0], tuple[1]);
    });
}

$(document).ready(function() {
    displayAllCookies();
});
