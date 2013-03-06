/*globals
window: false,
JQUERY_URL: false,
define: false, require: false, REQUIRE_CONFIG: false,
QUnit: false,
module: false, test: false, asyncTest: false, start: false, stop: false,
ok: false, equal: false, strictEqual: false, notStrictEqual: false
*/
/*jshint unused: false */

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

define(['jquery', 'ajaxtransportmiddleware'], function($, plugin, undefined) {

    'use strict';

    /**
     * A utility function to provide a clean copy of jQuery with the plugin
     * installed that can be discarded for each test.
     *
     * @returns {jQuery} a fresh copy of jQuery with the ajaxTransportMiddleware
     *     plugin preinstalled and already unbound from the window using
     *     noConflict.
     */
    function jQuerySandbox() {
        // Save the global jQuery
        var global$ = window.$;

        // Need to make this load as if require were not installed
        var globalDefine = window.define;
        window.define = undefined;

        // Load jQuery and the plugin as normal
        $.globalEval(jQuerySandbox.jqSrc);
        $.globalEval(jQuerySandbox.pluginSrc);
        var sandbox$ = window.$;

        // And now we need to restore the global state
        while (window.$ && window.$ !== global$) {
            window.$.noConflict(true);
        }
        window.define = globalDefine;

        return sandbox$;
    }

    var jqURL = '../' + JQUERY_URL;
    var pluginURL = '../src/ajaxtransportmiddleware.js';

    $.ajax(jqURL, {
        async: false,
        dataType: 'text',
        success: function(data) {
            jQuerySandbox.jqSrc = data;
        }
    });
    $.ajax(pluginURL, {
        async: false,
        dataType: 'text',
        success: function(data) {
            jQuerySandbox.pluginSrc = data;
        }
    });

    /* ====================================================================== */
    module('ajaxTransportMiddleware.installation.normal', {
        setup: function() {
            this.define = window.define;
            this.require = window.require;
            this.global$ = window.$;
            window.define = undefined;
            window.require = undefined;
        },
        teardown: function() {
            while (window.$ && window.$ !== this.global$) {
                window.$.noConflict(true);
            }
            window.define = this.define;
            window.require = this.require;
        }
    });

    test('installable in normal way', 6, function() {
        ok(!$.isFunction(window.require), 'require unavailable');
        ok(!$.isFunction(window.define), 'define unavailable');

        $.globalEval(jQuerySandbox.jqSrc);
        ok($.isFunction(window.$), 'jQuery installed.');
        notStrictEqual(window.$, this.global$, 'jQuery is fresh copy');
        ok(!window.$.hasOwnProperty('ajaxTransportMiddleware'),
           'middleware plugin not yet installed');

        $.globalEval(jQuerySandbox.pluginSrc);
        ok($.isFunction(window.$.ajaxTransportMiddleware),
           'middleware plugin is installed');
    });

    /* ====================================================================== */
    module('ajaxTransportMiddleware.installation.require', {
        setup: function() {
            this.jQuery = window.$;
            require.undef('jquery');
            require.undef('ajaxtransportmiddleware');
        },
        teardown: function() {
            while (window.$ && window.$ !== this.jQuery) {
                window.$.noConflict(true);
            }
        }
    });

    asyncTest('installable through require.js', 6, function() {
        ok($.isFunction(require), 'require available');
        ok($.isFunction(define) && define.amd, 'define available');

        var testCase = this;
        require(['jquery'], function(jq) {
            ok($.isFunction(jq), 'jQuery imported via require');
            notStrictEqual(jq, testCase.jQuery, 'jQuery is fresh copy');
            ok(!jq.hasOwnProperty('ajaxTransportMiddleware'),
               'middleware plugin not yet installed');
            require(['ajaxtransportmiddleware'], function(plugin) {
                strictEqual(jq.ajaxTransportMiddleware, plugin,
                            'middleware plugin is installed');
                start();
            });
        });
    });

    /* ====================================================================== */
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
            this.orig$ = $;
            $ = jQuerySandbox();
            this.mw = {};
            this.mw.testMiddleware1 = [];
            this.mw.testMiddleware2 = [];
            this.mw.all = [];

            var mw1, mw2;
            for (var i = 0; i < 5; ++i) {
                mw1 = $.ajaxTransportMiddleware({name: 'testMiddleware1'});
                mw2 = $.ajaxTransportMiddleware({name: 'testMiddleware2'});
                this.mw.testMiddleware1.push(mw1);
                this.mw.testMiddleware2.push(mw2);
                this.mw.all.push(mw1);
                this.mw.all.push(mw2);
            }
        },
        teardown: function() {
            $ = this.orig$;
        }
    });

    test('has getByName method', 1, function() {
        ok($.isFunction($.ajaxTransportMiddleware.getByName),
           'exists and is a function');
    });

    test('getByName returns array', 1, function() {
        var mw = $.ajaxTransportMiddleware.getByName('testMiddleware1');
        ok($.isArray(mw), 'is an array');
    });

    test('getByName returns the correct number of objects', 1, function() {
        var mw = $.ajaxTransportMiddleware.getByName('testMiddleware1');
        equal(mw.length, this.mw.testMiddleware1.length,
              'correct number returned');
    });

    test('getByName returns the right objects', 6, function() {
        var mw = $.ajaxTransportMiddleware.getByName('testMiddleware1');
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
        var mw = $.ajaxTransportMiddleware.getByName('testMiddleware1');
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
        var mw = $.ajaxTransportMiddleware.getByName('testMiddleware1',
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
        var mw = $.ajaxTransportMiddleware.getByName('testMiddleware1',
                                                          true);
        equal(mw.length, 5, 'correct number returned');
        $.each(this.mw.testMiddleware1, $.proxy(function(_, middleware) {
            ok($.inArray(middleware, mw) >= 0,
               middleware.toString() + ' in array');
        }, this));
    });

    test('getByName("*") returns all', 11, function() {
        var mw = $.ajaxTransportMiddleware.getByName('*');
        equal(mw.length, 10, 'correct number returned');
        for (var i = 0; i < mw.length; ++i) {
            ok(
                $.inArray(mw[i], this.mw.all) >= 0,
                '' + mw[i] + ' in array.'
            );
        }
    });

    function _deactivateAndReturnTuples(testCase) {
        var tuples = [
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
        $.each(tuples, function(__, tuple) {
            var name = tuple[0];
            var index = tuple[1];
            var active = tuple[2];
            if (!active) {
                testCase.mw[name][index].deactivate();
            }
        });
        return tuples;
    }

    test('getByName("*") skips inactive by default', 11, function() {
        var tuples = _deactivateAndReturnTuples(this);
        var mw = $.ajaxTransportMiddleware.getByName('*');

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
        var mw = $.ajaxTransportMiddleware.getByName('*', false);

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
        var mw = $.ajaxTransportMiddleware.getByName('*', true);

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

    /* --- testing utility functions --- */
    function _completeWrapper500(completeCallback) {
        return function(status, statusText, responses, headers) {
            return completeCallback(
                500,
                'Internal Server Error',
                responses,
                headers
            );
        };
    }

    function _expectCalled(name) {
        return function() {
            ok(true, name + ' called as expected.');
        };
    }

    function _expectNotCalled(name) {
        return function() {
            var args = ['['];
            $.each(arguments, function(_, arg) {
                args.push('' + arg);
                args.push(', ');
            });
            if (args.length > 1) {
                args.pop();  // strip final comma
            }
            args.push(']');

            ok(false,
               name + ' called and should not have been. ' + args.join(''));
        };
    }

    function _buildAjaxOptions(options) {
        return $.extend({}, _buildAjaxOptions.DEFAULTS, options);
    }
    _buildAjaxOptions.DEFAULTS = {
        url: '',
        success: _expectCalled('success'),
        error: _expectNotCalled('error'),
        complete: function() {
            ok(true, 'Call completed');
            start();
        }
    };

    /* --- actual test cases --- */
    asyncTest('establish that base ajax call works', 2, function() {
        $.ajax(_buildAjaxOptions());
    });

    asyncTest('default handlers do not prevent normal call', 2, function() {
            this.$.ajaxTransportMiddleware();
            $.ajax(_buildAjaxOptions());
        }
    );

    asyncTest('modify callbacks get called', 4, function() {
        this.$.ajaxTransportMiddleware({
            filter: function() {
                ok(true, 'filter got called');
                return true;
            },
            completeCallbackWrapper: function(completeCallback) {
                ok(true, 'completeCallbackWrapper got called');
                return completeCallback;
            }
        });
        this.$.ajax(_buildAjaxOptions());
    });

    asyncTest('completeCallbackWrapper can override statusCode', 6, function() {
        this.$.ajaxTransportMiddleware({
            completeCallbackWrapper: _completeWrapper500
        });

        this.$.ajax(_buildAjaxOptions({
            success: _expectNotCalled('success'),
            error: function(xhr, textStatus, errorThrown) {
                _expectCalled('error').apply(this, arguments);
                equal(xhr.status, 500, 'Got 500 response as expected.');
                equal(textStatus, 'error', 'Treated as a normal server error.');
                equal(errorThrown, 'Internal Server Error',
                      'Got expected errorThrown');
            },
            statusCode: {
                500: _expectCalled('500')
            }
        }));
    });

    asyncTest('disabled middleware does not modify calls', 2, function() {
        var middleware = this.$.ajaxTransportMiddleware({
            completeCallbackWrapper: _completeWrapper500
        });

        middleware.deactivate();

        this.$.ajax(_buildAjaxOptions());
    });

    asyncTest('filter selectively applies middleware', 5, function() {
        this.$.ajaxTransportMiddleware({
            filter: function(options) {
                return (/handle=true/).test(options.data);
            },
            completeCallbackWrapper: _completeWrapper500
        });

        // We need to wait until both calls are done to trigger start()
        this.$.when([

            this.$.ajax(_buildAjaxOptions({
                complete: _expectCalled('complete')
            })),

            this.$.ajax(_buildAjaxOptions({
                data: {handle: true},
                success: _expectNotCalled('success'),
                error: _expectCalled('error'),
                statusCode: {
                    500: _expectCalled('500')
                },
                complete: _expectCalled('complete')
            }))

        ]).then(function() {
            start();
        });
    });

    // TODO: hook into jQuery's AJAX test suite to make sure it all still works

});
