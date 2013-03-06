/*global
require: false,
QUnit: false
*/
(function() {
    'use strict';

    function getTests() {
        return [
            'test/ajaxtransportmiddleware_test'
        ];
    }
    QUnit.config.autostart = false;
    require(getTests(), function() {
        QUnit.start();
    });
}());
