/*jshint unused: false */
/*global
	jQuery: false,
	window: false,
	module: false,
	test: false,
	asyncTest: false,
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
 *	 module(name, {[setup][ ,teardown]})
 *	 test(name, callback)
 *	 expect(numberOfAssertions)
 *	 stop(increment)
 *	 start(decrement)
 * Test assertions:
 *	 ok(value, [message])
 *	 equal(actual, expected, [message])
 *	 notEqual(actual, expected, [message])
 *	 deepEqual(actual, expected, [message])
 *	 notDeepEqual(actual, expected, [message])
 *	 strictEqual(actual, expected, [message])
 *	 notStrictEqual(actual, expected, [message])
 *	 throws(block, [expected], [message])
 */

(function($) {
	'use strict';

	/**
	 * A utility function to provide a clean copy of jQuery with the plugin
	 * installed that can be discarded for each test.
	 *
	 * @returns {jQuery} a fresh copy of jQuery with the ajaxTransportMiddleware
	 *	 plugin preinstalled and already unbound from the window using
	 *	 noConflict.
	 */
	function jQuerySandbox() {
		// To facilitate debugging, we will use the global jQuery when only
		// a single test is being run.
		if (/[\?&]testNumber=\d+/.test(window.location.href)) {
			return $;
		}
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
	module('ajaxTransportMiddleware.constructor');

	test('is installed and callable', 1, function() {
		ok($.isFunction($.ajaxTransportMiddleware),
		   'exists and is callable');
	});

	test('instantiable without new', 1, function() {
		var middleware = $.ajaxTransportMiddleware();
		ok(middleware instanceof $.ajaxTransportMiddleware,
		   'object created without new passes instanceof test');
	});

	test('instantiable with new', 1, function() {
		var middleware = new $.ajaxTransportMiddleware();
		ok(middleware instanceof $.ajaxTransportMiddleware,
		   'object created with new passes instanceof test');
	});


	/* ====================================================================== */
	module('ajaxTransportMiddleware.instanceMethods', {
		setup: function() {
			this.middleware = $.ajaxTransportMiddleware();
		}
	});

	test('has activate method', 1, function() {
		ok($.isFunction(this.middleware.activate), 'exists and is a function');
	});

	test('has deactivate method', 1, function() {
		ok($.isFunction(this.middleware.deactivate),
		   'exists and is a function');
	});

	test('has isActive method', 1, function() {
		ok($.isFunction(this.middleware.isActive), 'exists and is a function');
	});

	test('isActive defaults to true', 1, function() {
		ok(this.middleware.isActive(), 'is active by default');
	});

	test('deactivate changes isActive to false', 1, function() {
		this.middleware.deactivate();
		ok(!this.middleware.isActive(), 'is deactivated');
	});

	test('activate changes isActive to true', 2, function() {
		// First confirm the opposite
		this.middleware.deactivate();
		ok(!this.middleware.isActive(), 'was deactivated');

		this.middleware.activate();
		ok(this.middleware.isActive(), 'and is now active');
	});


	/* ====================================================================== */
	module('ajaxTransportMiddleware.getByName', {
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
		ok($.isFunction(this.$.ajaxTransportMiddleware.getByName),
		   'exists and is a function');
	});

	test('getByName returns array', 1, function() {
		var mw = this.$.ajaxTransportMiddleware.getByName('testMiddleware1');
		ok($.isArray(mw), 'is an array');
	});

	test('getByName returns the correct number of objects', 1, function() {
		var mw = this.$.ajaxTransportMiddleware.getByName('testMiddleware1');
		equal(mw.length, this.mw.testMiddleware1.length,
			  'correct number returned');
	});

	test('getByName returns the right objects', 6, function() {
		var mw = this.$.ajaxTransportMiddleware.getByName('testMiddleware1');
		equal(mw.length, 5, 'correct number returned');
		for (var i = 0; i < mw.length; ++i) {
			ok(
				$.inArray(mw[i], this.mw.testMiddleware1) >= 0,
				'' + mw[i] + ' in array.'
			);
		}
	});

	test('getByName skips inactive by default', 6, function() {
		this.mw.testMiddleware1[0].deactivate();
		this.mw.testMiddleware1[3].deactivate();
		var mw = this.$.ajaxTransportMiddleware.getByName('testMiddleware1');
		equal(mw.length, 3, 'correct number returned');
		$.each([1, 2, 4], $.proxy(function(_, ix) {
			ok($.inArray(this.mw.testMiddleware1[ix], mw) >= 0,
			   this.mw.testMiddleware1[ix].toString() + ' in array');
		}, this));
		$.each([0, 3], $.proxy(function(_, ix) {
			equal($.inArray(this.mw.testMiddleware1[ix], mw), -1,
				  this.mw.testMiddleware1[ix].toString() + ' not in array');
		}, this));
	});

	test('getByName skips inactive when passed false', 6, function() {
		this.mw.testMiddleware1[0].deactivate();
		this.mw.testMiddleware1[3].deactivate();
		var mw = this.$.ajaxTransportMiddleware.getByName('testMiddleware1',
														  false);
		equal(mw.length, 3, 'correct number returned');
		$.each([1, 2, 4], $.proxy(function(_, ix) {
			ok($.inArray(this.mw.testMiddleware1[ix], mw) >= 0,
			   this.mw.testMiddleware1[ix].toString() + ' in array');
		}, this));
		$.each([0, 3], $.proxy(function(_, ix) {
			equal($.inArray(this.mw.testMiddleware1[ix], mw), -1,
				  this.mw.testMiddleware1[ix].toString() + ' not in array');
		}, this));
	});

	test('getByName includes inactive if requested', 6, function() {
		this.mw.testMiddleware1[0].deactivate();
		this.mw.testMiddleware1[3].deactivate();
		var mw = this.$.ajaxTransportMiddleware.getByName('testMiddleware1',
														  true);
		equal(mw.length, 5, 'correct number returned');
		$.each(this.mw.testMiddleware1, $.proxy(function(_, middleware) {
			ok($.inArray(middleware, mw) >= 0,
			   middleware.toString() + ' in array');
		}, this));
	});

	test('getByName("*") returns all', 11, function() {
		var mw = this.$.ajaxTransportMiddleware.getByName('*');
		equal(mw.length, 10, 'correct number returned');
		for (var i = 0; i < mw.length; ++i) {
			ok(
				$.inArray(mw[i], this.mw.all) >= 0,
				'' + mw[i] + ' in array.'
			);
		}
	});

	function _deactivateAndReturnTuples(testCase) {
		testCase.mw.testMiddleware1[0].deactivate();
		testCase.mw.testMiddleware1[3].deactivate();
		testCase.mw.testMiddleware2[1].deactivate();
		testCase.mw.testMiddleware2[2].deactivate();
		testCase.mw.testMiddleware2[4].deactivate();
		return [
			// [<name>, <index>, <active>]
			['testMiddleware1', 0, false],
			['testMiddleware1', 1, true],
			['testMiddleware1', 2, true],
			['testMiddleware1', 3, false],
			['testMiddleware1', 4, true],
			['testMiddleware2', 0, true],
			['testMiddleware2', 1, false],
			['testMiddleware2', 2, false],
			['testMiddleware2', 3, true],
			['testMiddleware2', 4, false]
		];
	}

	test('getByName("*") skips inactive by default', 11, function() {
		var tuples = _deactivateAndReturnTuples(this);
		var mw = this.$.ajaxTransportMiddleware.getByName('*');

		equal(mw.length, 5, 'correct number returned');

		$.each(tuples, $.proxy(function(_, tuple) {
			var name = tuple[0],
				index = tuple[1],
				active = tuple[2];
			if (active) {
				ok($.inArray(this.mw[name][index], mw) >= 0,
				   this.mw[name][index].toString() + ' in array');
			} else {
				equal($.inArray(this.mw[name][index], mw), -1,
					  this.mw[name][index].toString() + ' not in array');
			}
		}, this));
	});

	test('getByName("*") skips inactive when passed false', 11, function() {
		var tuples = _deactivateAndReturnTuples(this);
		var mw = this.$.ajaxTransportMiddleware.getByName('*', false);

		equal(mw.length, 5, 'correct number returned');

		$.each(tuples, $.proxy(function(_, tuple) {
			var name = tuple[0],
				index = tuple[1],
				active = tuple[2];
			if (active) {
				ok($.inArray(this.mw[name][index], mw) >= 0,
				   this.mw[name][index].toString() + ' in array');
			} else {
				equal($.inArray(this.mw[name][index], mw), -1,
					  this.mw[name][index].toString() + ' not in array');
			}
		}, this));
	});

	test('getByName("*") includes inactive if requested', 11, function() {
		var tuples = _deactivateAndReturnTuples(this);
		var mw = this.$.ajaxTransportMiddleware.getByName('*', true);

		equal(mw.length, 10, 'correct number returned');

		$.each(this.mw.all, $.proxy(function(_, middleware) {
			ok($.inArray(middleware, mw) >= 0,
			   middleware.toString() + ' in array');
		}, this));
	});

	/* ====================================================================== */
	module('ajaxTransportMiddleware.modifyCallbacks', {
		setup: function() {
			this.$ = jQuerySandbox();

		}
	});

	asyncTest('establish that base ajax call works', 2, function() {
		$.ajax({
			url: '',
			success: function() {
				ok(true, 'Call completed successfully.');
			},
			error: function(xhr, textStatus, errorThrown) {
				ok(
					false,
					'Got an unexpected error. ' + textStatus + ':' + errorThrown
				);
			},
			complete: function() {
				ok(true, 'Call completed');
				start();
			}
		});
	});

	asyncTest(
		'establish that default handlers do not prevent normal call',
		2,
		function() {
			this.$.ajaxTransportMiddleware({
				name: 'testWrapper'
			});
			$.ajax({
				url: '',
				success: function() {
					ok(true, 'Call completed successfully.');
				},
				error: function(xhr, textStatus, errorThrown) {
					ok(false,
					   'Got an unexpected error. ' + textStatus + ':' +
						   errorThrown);
				},
				complete: function() {
					ok(true, 'Call completed');
					start();
				}
			});
		}
	);

	asyncTest('modify callbacks get called', 5, function() {
		this.$.ajaxTransportMiddleware({
			name: 'testWrapper',
			filter: function() {
				ok(true, 'filter got called');
				return true;
			},
			modifyRequestHeaders: function(headers) {
				ok(true, 'modifyHeaders got called');
				return headers;
			},
			modifyCompleteCallback: function(completeCallback) {
				ok(true, 'modifyCompleteCallback got called');
				return completeCallback;
			}
		});
		this.$.ajax({
			url: '',
			success: function() {
				ok(true, 'Call completed successfully.');
			},
			error: function(xhr, textStatus, errorThrown) {
				ok(false,
				   'Got an unexpected error. ' + textStatus + ':' +
					   errorThrown);
			},
			complete: function() {
				ok(true, 'Call completed');
				start();
			}
		});
	});

	function _install500Middleware(testCase) {
		return testCase.$.ajaxTransportMiddleware({
			name: 'testWrapper',
			modifyCompleteCallback: function(completeCallback) {
				return function(status, statusText, responses, headers) {
					return completeCallback(
						500,
						'error',
						responses,
						headers
					);
				};
			}
		});
	}

	asyncTest('modifyCompleteCallback can override statusCode', 5, function() {
		_install500Middleware(this);

		this.$.ajax({
			url: '',
			success: function() {
				ok(false,
				   'Success handler was called and should not have been');
			},
			error: function(xhr, textStatus, errorThrown) {
				ok(true, 'error handler was called');
				equal(textStatus, 'error', 'Got correct textStatus');
				equal(xhr.status, 500, 'Got 500 response as expected.');
			},
			statusCode: {
				500: function() {
					ok(true, '500 handler called');
				}
			},
			complete: function() {
				ok(true, 'Call completed');
				start();
			}
		});
	});

	asyncTest('disabled middleware does not modify calls', 2, function() {
		var middleware = _install500Middleware(this);

		middleware.deactivate();

		this.$.ajax({
			url: '',
			success: function() {
				ok(true, 'Call completed successfully.');
			},
			error: function(xhr, textStatus, errorThrown) {
				ok(false,
				   'Got an unexpected error. ' + textStatus + ':' +
					   errorThrown);
			},
			complete: function() {
				ok(true, 'Call completed');
				start();
			}
		});
	});

	// TODO: filter function tests
	// TODO: modifyRequestHeaders tests
	// TODO: hook into jQuery's AJAX test suite to make sure it all still works

}(jQuery));
