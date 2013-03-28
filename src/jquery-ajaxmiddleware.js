/*
 * jquery-ajaxmiddleware
 * https://github.com/kentfrazier/jquery-ajaxmiddleware
 *
 * Copyright (c) 2013 Kent Frazier
 * Licensed under the MIT license.
 */

/**
 * @fileOverview
 * A jQuery module that provides hooks
 */
(function(factory, window) {
    'use strict';

    /*global jQuery: false, define: false */

    /* --- Install the module --- */
    if (typeof define === 'function' && define.amd) {
        // TODO: This is really ugly. Is there a better way to pass non-AMD
        // params?
        define('_windowGlobal', [], function() { return window; });
        define(['jquery', '_windowGlobal'], factory);
    } else {
        // relies on browser global jQuery and window
        factory(jQuery, window);
    }
}(function($, window, undefined) {
    'use strict';

    /**
     * Currently registered middleware objects.
     *
     * The key is the name of the middleware, and the value is an array
     * of middleware objects registered to that key.
     *
     * @private
     * @type {Object.<String, ajaxMiddleware[]>}
     */
    var registry = {
        ids: {},
        names: {},
        add: function(middleware) {
            var id = middleware.id;
            var name = middleware.name;

            this.ids[id] = middleware;
            this.names[name] = this.names[name] || [];
            this.names[name].push(middleware);
        }
    };

    /**
     * Generate a unique key for each middleware object.
     *
     * @private
     * @function
     * @returns {String} a new unique key
     */
    var generateID = (function(seed) {
        return function generateID() {
            var id = '' + seed;
            ++seed;
            return id;
        };
    }($.now()));

    function createPrefilter(middleware) {
        return function(options, originalOptions, jqXHR) {
            if (!middleware.isActive()) {
                return;
            }

            /* Ensure that options has a namespace for this module. */
            $.extend(true, options, {_ajaxMiddleware: {}});

            if (options._ajaxMiddleware[middleware.id]) {
                return;
            }

            /* Now we need to mark the options so we know this middleware has
             * processed it.
             */
            options._ajaxMiddleware[middleware.id] = true;

            if (middleware.options.shouldIntercept(options,
                                                   originalOptions,
                                                   jqXHR)) {
                /* Returning a string from here will cause the AJAX handlers to
                 * treat it as a different dataType.  This is necessary so that
                 * the ajaxTransport handler we install below can have higher
                 * precedence than the defaults.
                 */
                return middleware.dataType;
            }
        };
    }

    function createTransport(middleware) {
        return function(options, originalOptions) {
            /* Define this in the closure scope so that the send and abort
             * functions can both access it.
             */
            var request;

            function send(headers, completeCallback) {
                var overrides = {
                    /* Convert everything to text. The original request
                     * will handle all the necessary conversion.
                     */
                    // TODO: This will break anything that doesn't use the
                    // default transport! I need to figure out how to avoid
                    // breaking things like script and jsonp!
                    dataType: 'text',
                    converters: {
                        '* text': window.String
                    },

                    /* Don't want AJAX events to go off for the inner call.
                     * That will happen when completeCallback is called.
                     */
                    global: false,

                    /* Pass along any request headers that were specified */
                    headers: headers,

                    /* Prevent any of the original success or error handlers
                     * from running
                     */
                    statusCode: null,
                    success: null,
                    error: null,

                    /* Completion of the underlying request will trigger our
                     * postprocessing and then call the original handlers
                     * specified by the user.
                     */
                    complete: function(jqXHR, textStatus) {
                        var completeParams = {
                            status: jqXHR.status,
                            textStatus: textStatus,
                            responses: {text: jqXHR.responseText},
                            headers: jqXHR.getAllResponseHeaders()
                        };

                        /* Now we give the middleware a chance to modify
                         * the returned values before calling the original
                         * completeCallback.
                         */
                        middleware.options.beforeComplete(
                            completeParams,
                            options,
                            originalOptions
                        );

                        completeCallback(
                            completeParams.status,
                            completeParams.textStatus,
                            completeParams.responses,
                            completeParams.headers
                        );
                    }
                };

                /* Have to get rid of the fake dataType we added */
                options.dataTypes.shift();

                var overriddenOptions = $.extend(
                    true,
                    {},
                    options,
                    overrides
                );

                request = $.ajax(overriddenOptions);
            }

            function abort() {
                if (request) {
                    request.abort();
                }
            }

            return {
                send: send,
                abort: abort
            };
        };
    }

    /**
     * The real constructor for ajaxMiddleware.
     *
     * @constructor
     * @private
     * @param {Object} options
     *     see the module JSDoc for detail on what can be passed in.
     */
    function Middleware(options) {
        this.options = $.extend(
            true,
            {},
            ajaxMiddleware.DEFAULT_OPTIONS,
            options
        );
        this.name = this.options.name;
        this.id = generateID();

        /* For some reason, jQuery lower cases all dataTypes on ajaxPrefilters,
         * but later does not do the same when checking ajaxTransports.
         * To make it work, we need to be consistent with that and always use
         * lower case.
         */
        this.dataType = (this.name + this.id).toLowerCase();

        this.activate();
    }


    /**
     * Handles the business of installing the middleware.
     *
     * @private
     * @returns {void}
     */
    function installMiddleware(middleware) {
        /* Install this middleware in the registry so we can track it
         */
        registry.add(middleware);

        /* First we need to install a prefilter in order to give the
         * transport handler a place to hook in
         */
        $.ajaxPrefilter(
            middleware.options.dataTypes,
            createPrefilter(middleware)
        );

        /* Now we can catch the new dataType we just inserted and call
         * our hooks
         */
        $.ajaxTransport(
            middleware.dataType,
            createTransport(middleware)
        );
    }

    /**
     * The module itself.
     *
     * @constructor
     * @param {Object} options
     */
    function ajaxMiddleware(options) {
        return new Middleware(options);
    }

    /* ajaxMiddleware is the public face of the internal Middleware
     * object, and they need to evaluate to the same type (or instances of
     * either should pass the instanceof test with the other). Setting their
     * prototypes to the same object will ensure that this happens, as defined
     * by ECMA-262 sections 11.8.6 and 15.3.5.3.
     */
    ajaxMiddleware.prototype = Middleware.prototype = {

        /* ------------------------------------------------------------------ *
         *                          PUBLIC API
         * ------------------------------------------------------------------ */

        /**
         * Activate this middleware class.
         */
        activate: function() {
            this._active = true;
            if (!(this.id in registry.ids)) {
                installMiddleware(this);
            }
        },

        /**
         * Deactivate this middleware class.
         */
        deactivate: function() {
            this._active = false;
        },

        /**
         * @returns {boolean} whether the middleware is currently active
         */
        isActive: function() {
            return this._active;
        },

        /**
         * @returns {String} a simple string representation
         */
        toString: function() {
            return [
                '<ajaxMiddleware: ',
                this.dataType,
                ', ',
                this.id,
                '>'
            ].join('');
        }

    };

    /* ---------------------------------------------------------------------- *
     *                          PUBLIC MEMBERS
     * ---------------------------------------------------------------------- */
    $.extend(ajaxMiddleware, {
        /**
         * The default options for middleware. These values are all
         * overrideable. See the documentation for individual attributes to
         * understand what to pass in.
         *
         * @type {Object}
         */
        DEFAULT_OPTIONS: {
            /**
             * The namespace used for this middleware object.
             *
             * @type {String}
             */
            name: 'ajaxMiddleware',

            /**
             * The dataTypes to be handled.
             *
             * @type {String}
             */
            dataTypes: '*',

            /**
             * A predicate function to determine whether this middleware
             * should process this request.
             *
             * @param {Object} options
             *     The fully merged AJAX options for this request
             * @param {Object} originalOptions
             *     The original AJAX options specified by the user
             * @param {jqXHR} jqXHR
             *     The jQuery-wrapped XMLHttpResponse (or similar) object
             *
             * @returns {boolean} whether the request should be processed.
             */
            shouldIntercept: function() {
                // Process all requests for the dataTypes by default.
                return true;
            },

            /**
             * Hook to modify the parameters to be sent to completeCallback.
             *
             * @param {Object} completeParams
             *     Has four items, each corresponding to one of the arguments
             *     to completeCallback as defined by jQuery. It uses the names
             *     that jQuery gives them, but they are as follows:
             *         status: the HTTP status code of the response
             *         statusText: the text for the status (e.g. Internal
             *             Server Error)
             *         responses: (optional) is an object containing
             *             dataType->value mappings that contains the response
             *             in all the formats the transport could provide.
             *         headers: (optional) is a string containing all the
             *             response headers if the transport has access to
             *             them.
             * @param {Object} options
             *     The AJAX options for the intercepted call.
             * @param {Object} originalOptions
             *     The original AJAX options for the intercepted call.
             */
            beforeComplete: function() {
                /* Do nothing by default. */

                /* If we modify completeParams here, it will affect the values
                 * that are passed to the completeCallback.
                 */
            }
        },

        /**
         * @param {String} name
         *     the name of the middleware type in question, or '*' to return
         *     all registered middleware.
         * @param {boolean} [includeDeactivated=false]
         *     whether or not to include deactivated middleware in results
         * @returns {ajaxMiddleware[]}
         *     an array of all middleware registered using that name. If
         *     includeDeactivated is true, it will include the deactivated
         *     middleware as well.
         */
        getByName: function(name, includeDeactivated) {
            var results = [];
            if (name === '*') {
                for (var mwName in registry.names) {
                    if (registry.names.hasOwnProperty(mwName)) {
                        $.merge(results,
                                this.getByName(mwName, includeDeactivated));
                    }
                }
            } else {
                $.merge(results, registry.names[name] || []);
                results = $.grep(results, function(middleware) {
                    return includeDeactivated || middleware._active;
                });
            }
            return results;
        },

        _jQuery: $
    });

    /* Install for normal jQuery */
    $.ajaxMiddleware = ajaxMiddleware;

    /* Return for AMD */
    return ajaxMiddleware;
},
this));
