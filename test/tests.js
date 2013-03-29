/*globals
window: false,
define: false, require: false,
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

define(
    ['jquery-versionmanager',
     'jquery',
     'text!jquery-source',
     'text!jquery-ajaxmiddleware-source'],
    function(versionManager,
             jQuery,
             jQuerySource,
             pluginSource,
             undefined) {

    'use strict';

    var JQ_VERSION = versionManager.version();
    var JQ_VERSION_PREFIX = '[jquery-' + JQ_VERSION + '] ';

    /* --- Imported jQuery Utilities --- */
    var each = jQuery.each;
    var extend = jQuery.extend;
    var globalEval = jQuery.globalEval;
    var inArray = jQuery.inArray;
    var isArray = jQuery.isArray;
    var isFunction = jQuery.isFunction;
    var proxy = jQuery.proxy;

    /* --- testing utility functions --- */

    /**
     * Value of window.$ at the beginning of execution for this module.
     * @const
     * @type {jQuery|undefined}
     */
    var _GLOBAL$ = window.$;

    /**
     * The current sandboxed jQuery.
     *
     * $ should only be used for the current sandboxed jQuery, and should
     * be set to null in each teardown.
     * @type {jQuery|null}
     */
    var $ = null;

    function _createSandbox() {
        var _require = window.require;
        var _define = window.define;

        window.require = undefined;
        window.define = undefined;

        globalEval(jQuerySource);
        globalEval(pluginSource);

        window.require = _require;
        window.define = _define;

        $ = window.$;
        while (window.$ && window.$ !== _GLOBAL$) {
            window.$.noConflict(true);
        }
    }

    function _destroySandbox() {
        $ = null;
    }

    function _beforeComplete500(completeParams) {
        extend(completeParams, {
            status: 500,
            textStatus: 'Internal Server Error'
        });
    }

    function _expectCalled(name) {
        return function() {
            ok(true, name + ' called as expected.');
        };
    }

    function _expectNotCalled(name) {
        return function() {
            var args = ['['];
            each(arguments, function(_, arg) {
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
        return extend({}, _buildAjaxOptions.DEFAULTS, options);
    }
    _buildAjaxOptions.DEFAULTS = {
        url: '../resources/ajaxTarget.html',
        success: _expectCalled('success'),
        error: _expectNotCalled('error'),
        complete: function() {
            ok(true, 'Call completed');
            start();
        }
    };


    /* ====================================================================== */
    module(JQ_VERSION_PREFIX + 'installation by normal means', {
        setup: function() {
            this.define = window.define;
            this.require = window.require;
            window.define = undefined;
            window.require = undefined;
        },
        teardown: function() {
            while (window.$ && window.$ !== _GLOBAL$) {
                window.$.noConflict(true);
            }
            window.define = this.define;
            window.require = this.require;
        }
    });

    test('installable in normal way', 7, function() {
        ok(!isFunction(window.require), 'require unavailable');
        ok(!isFunction(window.define), 'define unavailable');

        globalEval(jQuerySource);
        ok(isFunction(window.$), 'jQuery installed.');
        notStrictEqual(window.$, this.global$, 'jQuery is fresh copy');
        ok(!window.$.hasOwnProperty('ajaxMiddleware'),
           'middleware plugin not yet installed');

        globalEval(pluginSource);
        ok(isFunction(window.$.ajaxMiddleware),
           'middleware plugin is installed');
        strictEqual(window.$.ajaxMiddleware._jQuery, window.$,
                    'plugin has reference to correct jQuery');
    });

    /* ====================================================================== */
    module(JQ_VERSION_PREFIX + 'installation with requirejs', {
        setup: function() {
            this.global$ = window.$;
            require.undef('jquery');
            require.undef('jquery-ajaxmiddleware');
        },
        teardown: function() {
            while (window.$ && window.$ !== this.global$) {
                window.$.noConflict(true);
            }
        }
    });

    asyncTest('installable through require.js', 7, function() {
        ok(isFunction(require), 'require available');
        ok(isFunction(define) && define.amd, 'define available');

        var testCase = this;
        require(['jquery'], function($) {
            ok(isFunction($), 'jQuery imported via require');
            notStrictEqual($, testCase.global$, 'jQuery is fresh copy');
            ok(!$.hasOwnProperty('ajaxMiddleware'),
               'middleware plugin not yet installed');
            require(['jquery-ajaxmiddleware'], function(plugin) {
                strictEqual($.ajaxMiddleware, plugin,
                            'middleware plugin is installed');
                strictEqual(plugin._jQuery, $,
                            'plugin has reference to correct jQuery');
                start();
            });
        });
    });

    /* ====================================================================== */
    module(JQ_VERSION_PREFIX + 'constructor', {
        setup: _createSandbox,
        teardown: _destroySandbox
    });

    test('is installed and callable', 1, function() {
        ok(isFunction($.ajaxMiddleware),
           'exists and is callable');
    });

    test('instantiable without new', 1, function() {
        var middleware = $.ajaxMiddleware();
        ok(middleware instanceof $.ajaxMiddleware,
           'object created without new passes instanceof test');
    });

    test('instantiable with new', 1, function() {
        var middleware = new $.ajaxMiddleware();
        ok(middleware instanceof $.ajaxMiddleware,
           'object created with new passes instanceof test');
    });


    /* ====================================================================== */
    /* This isn't really part of jquery-ajaxmiddleware, but we need to make
     * sure it works properly in order to trust all the tests below that use
     * it.
     */
    module(JQ_VERSION_PREFIX + 'jQuery sandbox');

    test('sandbox provides isolated jQuery environment', 9, function() {
        var global$ = window.$;

        strictEqual($, null, '$ is null before _createSandbox()');

        _createSandbox();
        ok(isFunction($), '$ is a function after _createSandbox()');
        ok('fn' in $ && 'jquery' in $.fn, '$ is jQuery');
        equal($.fn.jquery, JQ_VERSION, '$ is jQuery ' + JQ_VERSION);
        notStrictEqual($, global$, '$ is not original window.$');
        strictEqual(global$, window.$, 'window.$ is still original value');
        ok(isFunction($.ajaxMiddleware), 'ajaxMiddleware plugin installed');
        strictEqual($.ajaxMiddleware._jQuery, $,
                    'plugin has reference to correct jQuery');

        _destroySandbox();
        strictEqual($, null, '$ is null after _destroySandbox()');
    });

    /* ====================================================================== */
    module(JQ_VERSION_PREFIX + 'instance methods', {
        setup: function() {
            _createSandbox();
            this.middleware = $.ajaxMiddleware();
        },
        teardown: _destroySandbox
    });

    test('has activate method', 1, function() {
        ok(isFunction(this.middleware.activate), 'exists and is a function');
    });

    test('has deactivate method', 1, function() {
        ok(isFunction(this.middleware.deactivate),
           'exists and is a function');
    });

    test('has isActive method', 1, function() {
        ok(isFunction(this.middleware.isActive), 'exists and is a function');
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
    module(JQ_VERSION_PREFIX + 'getByNamespace', {
        setup: function() {
            _createSandbox();
            this.mw = {};
            this.mw.testMiddleware1 = [];
            this.mw.testMiddleware2 = [];
            this.mw.all = [];

            var mw1, mw2;
            for (var i = 0; i < 5; ++i) {
                mw1 = $.ajaxMiddleware({namespace: 'testmiddleware1'});
                mw2 = $.ajaxMiddleware({namespace: 'testmiddleware2'});
                this.mw.testMiddleware1.push(mw1);
                this.mw.testMiddleware2.push(mw2);
                this.mw.all.push(mw1);
                this.mw.all.push(mw2);
            }
        },
        teardown: _destroySandbox
    });

    test('has getByNamespace method', 1, function() {
        ok(isFunction($.ajaxMiddleware.getByNamespace),
           'exists and is a function');
    });

    test('getByNamespace returns array', 1, function() {
        var mwSet = $.ajaxMiddleware.getByNamespace('testmiddleware1');
        ok(isArray(mwSet), 'is an array');
    });

    test('getByNamespace returns the correct number of objects', 1, function() {
        var mwSet = $.ajaxMiddleware.getByNamespace('testmiddleware1');
        equal(mwSet.length, this.mw.testMiddleware1.length,
              'correct number returned');
    });

    test('getByNamespace returns the right objects', 6, function() {
        var mwSet = $.ajaxMiddleware.getByNamespace('testmiddleware1');
        equal(mwSet.length, 5, 'correct number returned');
        for (var i = 0; i < mwSet.length; ++i) {
            ok(
                inArray(mwSet[i], this.mw.testMiddleware1) >= 0,
                '' + mwSet[i] + ' in array.'
            );
        }
    });

    test('getByNamespace skips inactive by default', 6, function() {
        this.mw.testMiddleware1[0].deactivate();
        this.mw.testMiddleware1[3].deactivate();
        var mwSet = $.ajaxMiddleware.getByNamespace('testmiddleware1');
        equal(mwSet.length, 3, 'correct number returned');
        each([1, 2, 4], proxy(function(_, ix) {
            ok(inArray(this.mw.testMiddleware1[ix], mwSet) >= 0,
               this.mw.testMiddleware1[ix].toString() + ' in array');
        }, this));
        each([0, 3], proxy(function(_, ix) {
            equal(inArray(this.mw.testMiddleware1[ix], mwSet), -1,
                  this.mw.testMiddleware1[ix].toString() + ' not in array');
        }, this));
    });

    test('getByNamespace skips inactive when passed false', 6, function() {
        this.mw.testMiddleware1[0].deactivate();
        this.mw.testMiddleware1[3].deactivate();
        var mwSet = $.ajaxMiddleware.getByNamespace('testmiddleware1',
                                                          false);
        equal(mwSet.length, 3, 'correct number returned');
        each([1, 2, 4], proxy(function(_, ix) {
            ok(inArray(this.mw.testMiddleware1[ix], mwSet) >= 0,
               this.mw.testMiddleware1[ix].toString() + ' in array');
        }, this));
        each([0, 3], proxy(function(_, ix) {
            equal(inArray(this.mw.testMiddleware1[ix], mwSet), -1,
                  this.mw.testMiddleware1[ix].toString() + ' not in array');
        }, this));
    });

    test('getByNamespace includes inactive if requested', 6, function() {
        this.mw.testMiddleware1[0].deactivate();
        this.mw.testMiddleware1[3].deactivate();
        var mwSet = $.ajaxMiddleware.getByNamespace('testmiddleware1',
                                                          true);
        equal(mwSet.length, 5, 'correct number returned');
        each(this.mw.testMiddleware1, proxy(function(_, middleware) {
            ok(inArray(middleware, mwSet) >= 0,
               middleware.toString() + ' in array');
        }, this));
    });

    test('getByNamespace("*") returns all', 11, function() {
        var mwSet = $.ajaxMiddleware.getByNamespace('*');
        equal(mwSet.length, 10, 'correct number returned');
        for (var i = 0; i < mwSet.length; ++i) {
            ok(
                inArray(mwSet[i], this.mw.all) >= 0,
                '' + mwSet[i] + ' in array.'
            );
        }
    });

    function _deactivateAndReturnTuples(testCase) {
        var tuples = [
            // [<namespace>, <index>, <active>]
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
        each(tuples, function(__, tuple) {
            var namespace = tuple[0];
            var index = tuple[1];
            var active = tuple[2];
            if (!active) {
                testCase.mw[namespace][index].deactivate();
            }
        });
        return tuples;
    }

    test('getByNamespace("*") skips inactive by default', 11, function() {
        var tuples = _deactivateAndReturnTuples(this);
        var mwSet = $.ajaxMiddleware.getByNamespace('*');

        equal(mwSet.length, 5, 'correct number returned');

        each(tuples, proxy(function(_, tuple) {
            var namespace = tuple[0],
                index = tuple[1],
                active = tuple[2];
            if (active) {
                ok(inArray(this.mw[namespace][index], mwSet) >= 0,
                   this.mw[namespace][index].toString() + ' in array');
            } else {
                equal(inArray(this.mw[namespace][index], mwSet), -1,
                      this.mw[namespace][index].toString() + ' not in array');
            }
        }, this));
    });

    test('getByNamespace("*") skips inactive if sent false', 11, function() {
        var tuples = _deactivateAndReturnTuples(this);
        var mwSet = $.ajaxMiddleware.getByNamespace('*', false);

        equal(mwSet.length, 5, 'correct number returned');

        each(tuples, proxy(function(_, tuple) {
            var namespace = tuple[0],
                index = tuple[1],
                active = tuple[2];
            if (active) {
                ok(inArray(this.mw[namespace][index], mwSet) >= 0,
                   this.mw[namespace][index].toString() + ' in array');
            } else {
                equal(inArray(this.mw[namespace][index], mwSet), -1,
                      this.mw[namespace][index].toString() + ' not in array');
            }
        }, this));
    });

    test('getByNamespace("*") includes inactive if sent true', 11, function() {
        var tuples = _deactivateAndReturnTuples(this);
        var mwSet = $.ajaxMiddleware.getByNamespace('*', true);

        equal(mwSet.length, 10, 'correct number returned');

        each(this.mw.all, proxy(function(_, middleware) {
            ok(inArray(middleware, mwSet) >= 0,
               middleware.toString() + ' in array');
        }, this));
    });

    test('getByNamespace is case insensitive', 20, function() {
        var variants = ['mw', 'mW', 'Mw', 'MW'];
        var mwSet = [];
        each(variants, function(_, ns) {
            mwSet.push($.ajaxMiddleware({namespace: ns}));
        });

        each(variants, function(_, ns) {
            var gbnSet = $.ajaxMiddleware.getByNamespace(ns);
            equal(gbnSet.length, 4,
                  'Right number returned with namespace: ' + ns);
            each(mwSet, function(_, mw) {
                ok(inArray(mw, gbnSet) >= 0,
                   '' + mw + ' returned with namespace: ' + ns);
            });
        });
    });

    /* ====================================================================== */
    module(JQ_VERSION_PREFIX + 'getByDataType', {
        setup: _createSandbox,
        teardown: _destroySandbox
    });

    test('getByDataType returns correct object', 50, function() {
        var mwSet = [];
        var i = 0;
        while (i++ < 50) {
            mwSet.push($.ajaxMiddleware({namespace: 'mw' + i}));
        }
        each(mwSet, function(_, mw) {
            strictEqual(mw, $.ajaxMiddleware.getByDataType(mw.dataType),
                        'correct object returned: ' + mw);
        });
    });

    test('getByDataType is case insensitive', 2, function() {
        var mw = $.ajaxMiddleware({namespace: 'tESt'});
        strictEqual(
            mw,
            $.ajaxMiddleware.getByDataType(mw.dataType.toLowerCase()),
            'Accepts all lower'
        );
        strictEqual(
            mw,
            $.ajaxMiddleware.getByDataType(mw.dataType.toUpperCase()),
            'Accepts all upper'
        );
    });

    test('getByDataType gets inactive middleware', 1, function() {
        var mw = $.ajaxMiddleware();
        mw.deactivate();
        strictEqual(mw, $.ajaxMiddleware.getByDataType(mw.dataType),
                    'Returns deactivated middleware');
    });

    /* ====================================================================== */
    module(JQ_VERSION_PREFIX + 'options', {
        setup: _createSandbox,
        teardown: _destroySandbox
    });

    asyncTest('establish that base ajax call works', 2, function() {
        $.ajax(_buildAjaxOptions());
    });

    asyncTest('default handlers do not prevent normal call', 2, function() {
        $.ajaxMiddleware();
        $.ajax(_buildAjaxOptions());
    });

    asyncTest('hooks get called', 4, function() {
        $.ajaxMiddleware({
            shouldIntercept: function() {
                ok(true, 'shouldIntercept got called');
                return true;
            },
            beforeComplete: function() {
                ok(true, 'beforeComplete got called');
            }
        });
        $.ajax(_buildAjaxOptions());
    });

    asyncTest('middleware is this in hook calls', 4, function() {
        var middleware = $.ajaxMiddleware({
            shouldIntercept: function() {
                strictEqual(this, middleware,
                            'middleware is this in shouldIntercept call');
                return true;
            },
            beforeComplete: function() {
                strictEqual(this, middleware,
                            'middleware is this in beforeComplete call');
            }
        });
        $.ajax(_buildAjaxOptions());
    });

    asyncTest('beforeComplete can override statusCode', 6, function() {
        $.ajaxMiddleware({
            beforeComplete: _beforeComplete500
        });

        $.ajax(_buildAjaxOptions({
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

    asyncTest('disabled middleware does not call hooks', 2, function() {
        var middleware = $.ajaxMiddleware({
            beforeComplete: _beforeComplete500
        });

        middleware.deactivate();

        $.ajax(_buildAjaxOptions());
    });

    asyncTest('shouldIntercept selectively applies middleware', 5, function() {
        $.ajaxMiddleware({
            shouldIntercept: function(options) {
                return (/handle=true/).test(options.data);
            },
            beforeComplete: _beforeComplete500
        });

        $.ajax(_buildAjaxOptions({
            complete: function() {
                _expectCalled('complete')();

                $.ajax(_buildAjaxOptions({
                    data: {handle: true},
                    success: _expectNotCalled('success'),
                    error: _expectCalled('error'),
                    statusCode: {
                        500: _expectCalled('500')
                    }
                }));
            }
        }));
    });

    asyncTest('ensure middleware nests properly (LIFO order)', 2, function() {
        $.ajaxMiddleware({
            beforeComplete: function(completeParams) {
                completeParams.responses.text += ' Bang bang, shoot shoot!';
            }
        });
        $.ajaxMiddleware({
            beforeComplete: function(completeParams) {
                completeParams.responses.text += ' is a warm gun.';
            }
        });
        $.ajaxMiddleware({
            beforeComplete: function(completeParams) {
                completeParams.responses.text = 'Happiness';
            }
        });

        $.ajax(_buildAjaxOptions({
            success: function(data) {
                equal(data, 'Happiness is a warm gun. Bang bang, shoot shoot!',
                      'Middleware executed in last-in, first-out order.');
            }
        }));

    });

    // TODO: hook into jQuery's AJAX test suite to make sure it all still works

    // No return intentionally. This is defined only for its side effects.
});
