/*global
window: false,
QUnit: false,
require: true,
REQUIRE_CONFIG: true, JQUERY_URL: true
*/

var JQUERY_URL = (function(defaultVersion) {
    'use strict';

    var params = window.location.search;
    var match = params.match(/[?&]jquery=([^\?&]*)/);
    var version = match && match[1] || defaultVersion;
    return 'libs/jquery/jquery-' + version + '.js';
}('1.9.1'));

var requirejs,
    REQUIRE_CONFIG;

require = REQUIRE_CONFIG = (function() {
    'use strict';

    return {
        baseUrl: '../',
        paths: {
            jquery: /^(.*)\.js$/.exec(JQUERY_URL)[1],
            ajaxtransportmiddleware: 'src/jquery-ajaxtransportmiddleware'
        },
        shim: {
            jquery: {
                exports: '$',
                init: function() {
                    return window.$.noConflict(true);
                }
            }
        }
    };
}());

QUnit.config.autostart = false;
