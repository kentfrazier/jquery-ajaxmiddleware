/*global
window: false,
require: false,
QUnit: false
*/
/*
 * TODO TODO TODO
 * This is currently not working as a main module for requirejs because it
 * seems to cause asyncTests in QUnit to go haywire. My guess is that the
 * start() call made by asyncTest causes QUnit to start evaluating the
 * dependencies, even though they are not necessarily done loading. It also
 * seems to get the start/stop semaphore in QUnit out of sync, which causes
 * assertions to happen in the wrong places.
 */
(function() {
    'use strict';

    var ALL_TEST_MODULES = [
        'test/allTests'
    ];

    function getTestModules() {
        var testModules = [],
            params = window.location.search.substring(1).split('&'),
            pair;
        for (var i = 0, len = params.length; i < len; ++i) {
            pair = params[i].split('=');
            if (pair[0] === 'testModule') {
                testModules.push('test/' + pair[1]);
            }
        }
        return testModules.length ? testModules : ALL_TEST_MODULES;
    }

    QUnit.config.autostart = false;
    require(getTestModules(), QUnit.start);
}());
