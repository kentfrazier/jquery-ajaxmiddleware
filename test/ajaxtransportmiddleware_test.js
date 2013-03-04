/*jshint unused: false */
/*global
	jQuery: false,
	window: false,
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

(function($) {
	'use strict';

	function jQuerySandbox() {
		$.globalEval(jQuerySandbox.jqSrc);		
		$.globalEval(jQuerySandbox.pluginSrc);
		return window.$.noConflict(true);
	}

	$.ajax('../libs/jquery/jquery.js', {
		async: false,
		dataType: 'text',
		success: function(data) {
			jQuerySandbox.jqSrc = data;
		}
	});
	$.ajax('../src/ajaxtransportmiddleware.js', {
		async: false,
		dataType: 'text',
		success: function(data) {
			jQuerySandbox.pluginSrc = data;
		}
	});

	// --- core function and constructor --- //
	module('jQuery.ajaxTransportMiddleware');

	test('is installed', 1, function() {
		ok('ajaxTransportMiddleware' in $);
	});

	test('is callable', 1, function() {
		ok($.isFunction($.ajaxTransportMiddleware));
	});

	test('instantiable without new', 1, function() {
		var middleware = $.ajaxTransportMiddleware();
		ok(middleware instanceof $.ajaxTransportMiddleware);
	});

	test('instantiable with new', 1, function() {
		var middleware = new $.ajaxTransportMiddleware();
		ok(middleware instanceof $.ajaxTransportMiddleware);
	});


	/* ===== INSTANCE METHODS ===== */
	module('ajaxTransportMiddleware instance methods', {
		setup: function() {
			this.middleware = $.ajaxTransportMiddleware();
		}
	});

	test('has activate method', 1, function() {
		ok($.isFunction(this.middleware.activate));
	});

	test('has deactivate method', 1, function() {
		ok($.isFunction(this.middleware.deactivate));
	});

	test('has isActive method', 1, function() {
		ok($.isFunction(this.middleware.isActive));
	});

	test('isActive defaults to true', 1, function() {
		ok(this.middleware.isActive());
	});

	test('deactivate changes isActive to false', 1, function() {
		this.middleware.deactivate();
		ok(!this.middleware.isActive());
	});

	test('activate changes isActive to true', 2, function() {
		// First confirm the opposite
		this.middleware.deactivate();
		ok(!this.middleware.isActive());

		this.middleware.activate();
		ok(this.middleware.isActive());
	});


	/* ===== CLASS METHODS ===== */
	module('ajaxTransportMiddleware class methods', {
		setup: function() {
			this.$ = jQuerySandbox();

			this.mw = {};
			this.mw.testMiddleware1 = [];
			this.mw.testMiddleware2 = [];
			this.mw.all = [];

			var mw1, mw2;
			for (var i = 0; i < 5; ++i) {
				mw1 = this.$.ajaxTransportMiddleware({name: 'testMiddleware1'});
				mw2 = this.$.ajaxTransportMiddleware({name: 'testMiddleware2'});
				this.mw.testMiddleware1.push(mw1);
				this.mw.testMiddleware2.push(mw2);
				this.mw.all.push(mw1);
				this.mw.all.push(mw2);
			}
		}
	});

	test('has getByName method', 1, function() {
		ok($.isFunction(this.$.ajaxTransportMiddleware.getByName));
	});

	test('getByName returns array', 1, function() {
		var mw = this.$.ajaxTransportMiddleware.getByName('testMiddleware1');
		ok($.isArray(mw));
	});

	test('getByName returns the correct number of objects', 1, function() {
		var mw = this.$.ajaxTransportMiddleware.getByName('testMiddleware1');
		equal(mw.length, this.mw.testMiddleware1.length);
	});

	test('getByName returns the right objects', 5, function() {
		var mw = this.$.ajaxTransportMiddleware.getByName('testMiddleware1');
		for (var i = 0; i < mw.length; ++i) {
			ok(
				$.inArray(mw[i], this.mw.testMiddleware1) >= 0,
				'' + mw[i] + ' in array.'
			);
		}
	});

	test('getByName("*") returns all', 11, function() {
		var mw = this.$.ajaxTransportMiddleware.getByName('*');
		ok(mw.length === 10);
		for (var i = 0; i < mw.length; ++i) {
			ok(
				$.inArray(mw[i], this.mw.all) >= 0,
				'' + mw[i] + ' in array.'
			);
		}
	});

}(jQuery));
