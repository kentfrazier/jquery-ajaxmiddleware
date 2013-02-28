/*jshint unused: false */
/*global
	jQuery:false,
	module: false,
	test: false,
	expect: false,
	stop: false,
	start: false,
	ok: false,
	equal: false,
	notEqual: false,
	deepEqual: false,
	notDeepEqual: false,
	strictEqual: false,
	notStrictEqual: false,
	throws: false */

(function($) {
	'use strict';

	/*
	 * ======== A Handy Little QUnit Reference ========
	 * http://api.qunitjs.com/
	 *
	 * Test methods:
	 *     module(name, {[setup][ ,teardown]})
	 *     test(name, callback)
	 *     expect(numberOfAssertions)
	 *     stop(increment)
	 *     start(decrement)
	 * Test assertions:
	 *     ok(value, [message])
	 *     equal(actual, expected, [message])
	 *     notEqual(actual, expected, [message])
	 *     deepEqual(actual, expected, [message])
	 *     notDeepEqual(actual, expected, [message])
	 *     strictEqual(actual, expected, [message])
	 *     notStrictEqual(actual, expected, [message])
	 *     throws(block, [expected], [message])
	 */

	module('jQuery#ajaxTransportMiddleware', {
		// This will run before each test in this module.
		setup: function() {
			this.elems = $('#qunit-fixture').children();
		}
	});

	// --- core function and constructor --- //
	module('jQuery.ajaxTransportMiddleware');

	test('is installed', function() {
		expect(1);
		ok('ajaxTransportMiddleware' in $);
	});

	test('is callable', function() {
		expect(1);
		ok($.isFunction($.ajaxTransportMiddleware));
	});

	test('instantiable without new', function() {
		expect(1);
		var middleware = $.ajaxTransportMiddleware();
		ok(middleware instanceof $.ajaxTransportMiddleware);
	});

	test('instantiable with new', function() {
		expect(1);
		var middleware = new $.ajaxTransportMiddleware();
		ok(middleware instanceof $.ajaxTransportMiddleware);
	});


	// --- uninstall method --- //
	module('jQuery.ajaxTransportMiddleware.uninstall', {
		setup: function() {
			this.middleware = $.ajaxTransportMiddleware();
		}
	});

	test('has uninstall method', function() {
		expect(2);
		ok('uninstall' in this.middleware);
		ok($.isFunction(this.middleware.uninstall));
	});

}(jQuery));
