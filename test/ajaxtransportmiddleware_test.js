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


	/* ===== INSTANCE METHODS ===== */
	module('ajaxTransportMiddleware instance methods', {
		setup: function() {
			this.middleware = $.ajaxTransportMiddleware();
		}
	});

	test('has activate method', function() {
		expect(1);
		ok($.isFunction(this.middleware.activate));
	});

	test('has deactivate method', function() {
		expect(1);
		ok($.isFunction(this.middleware.deactivate));
	});

	test('has isActive method', function() {
		expect(1);
		ok($.isFunction(this.middleware.isActive));
	});

	test('isActive defaults to true', function() {
		expect(1);
		ok(this.middleware.isActive());
	});

	test('deactivate changes isActive to false', function() {
		expect(1);
		this.middleware.deactivate();
		ok(!this.middleware.isActive());
	});

	test('activate changes isActive to true', function() {
		expect(2);

		// First confirm the opposite
		this.middleware.deactivate();
		ok(!this.middleware.isActive());

		this.middleware.activate();
		ok(this.middleware.isActive());
	});


	//TODO: figure out how to get a fresh copy of the global state for each
	// run. Maybe load each test in an iframe? Pretty ugly, but could get the
	// job done.
	///* ===== CLASS METHODS ===== */
	//module('ajaxTransportMiddleware class methods', {
	//	setup: function() {
	//		this.mw = {};
	//		this.mw.testMiddleware1 = [];
	//		this.mw.testMiddleware2 = [];

	//		for (var i = 0; i < 5; ++i) {
	//			this.mw.testMiddleware1.push(
	//				$.ajaxTransportMiddleware({name: 'testMiddleware1'})
	//			);
	//			this.mw.testMiddleware2.push(
	//				$.ajaxTransportMiddleware({name: 'testMiddleware2'})
	//			);
	//		}
	//	},
	//	teardown: function() {
	//		//TODO: how do we reset the global jQuery state? I don't think
	//		//we have access to the underlying ajaxPrefilter and ajaxTransport
	//		//registries to clear them.
	//	}
	//});

	//test('has getByName method', function() {
	//	expect(1);
	//	ok($.isFunction($.ajaxTransportMiddleware.getByName));
	//});

	//test('getByName returns array', function() {
	//	expect(1);
	//	var mw = $.ajaxTransportMiddleware.getByName('testMiddleware1');
	//	ok($.isArray(mw));
	//});

	//test('getByName returns the correct number of objects', function() {
	//	expect(1);
	//	var mw = $.ajaxTransportMiddleware.getByName('testMiddleware1');
	//	equal(mw.length, this.mw.testMiddleware1.length);
	//});

	//test('getByName returns the right objects', function() {
	//	expect(5);
	//	var mw = $.ajaxTransportMiddleware.getByName('testMiddleware1');
	//	for (var i = 0; i < mw.length; ++i) {
	//		ok(
	//			$.inArray(mw[i], this.mw.testMiddleware1),
	//			'' + mw[i] + ' missing from result!'
	//		);
	//	}
	//});

}(jQuery));
