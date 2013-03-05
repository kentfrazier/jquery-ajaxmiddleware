/*
 * ajaxtransportmiddleware
 * https://github.com/kentfrazier/jquery-ajaxtransportmiddleware
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
	 * @type {Object.<String, ajaxTransportMiddleware[]>}
	 */
	var registry = {
		ids: {},
		names: {},
		add: $.proxy(function(middleware) {
			var id = middleware.id;
			var name = middleware.name;

			this.ids[id] = middleware;
			this.names[name] = this.names[name] || [];
			this.names[name].push(middleware);
		}, registry)
	};

	/**
	 * Generate a unique key for each middleware object.
	 *
	 * @private
	 * @function
	 * @returns {String} a new unique key
	 */
	var generateID = (function(seed) {
		return function() {
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
			$.extend(true, options, {_ajaxTransportMiddleware: {}});

			if (options._ajaxTransportMiddleware[middleware.id]) {
				return;
			}

			/* Now we need to mark the options so we know this middleware has
			 * processed it.
			 */
			options._ajaxTransportMiddleware[middleware.id] = true;

			if (middleware.options.filter(options, originalOptions, jqXHR)) {
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
				headers = middleware.options.modifyRequestHeaders(
					headers,
					options,
					originalOptions
				);
				completeCallback = middleware.options.modifyCompleteCallback(
					completeCallback,
					options,
					originalOptions
				);

				var overrides = {
					/* Convert everything to text. The original request
					 * will handle all the necessary conversion.
					 */
					dataType: 'text',
					converters: {
						'* text': window.String
					},

					/* Don't want AJAX events to go off for the inner call.
					 * That will happen later.
					 */
					global: false,

					/* Pass along any request headers that were specified */
					headers: headers,

					/* Prevent any of the original handlers from running */
					statusCode: null,
					success: null,
					error: null,
					complete: function(jqXHR, textStatus) {
						completeCallback(
							jqXHR.status,
							textStatus,
							{text: jqXHR.responseText},
							jqXHR.getAllResponseHeaders()
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

			// Is this necessary?
			//if ( options.intercepted ) {
			//	return {
			//		send: send,
			//		abort: abort
			//	};
			//}
			return {
				send: send,
				abort: abort
			};
		};
	}

	/**
	 * The real constructor for ajaxTransportMiddleware.
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
			ajaxTransportMiddleware.DEFAULT_OPTIONS,
			options
		);
		this.name = this.options.name || null;
		this.id = generateID();

		/* For some reason, jQuery lower cases all dataTypes on ajaxPrefilters,
		 * but later does not do the same when checking ajaxTransports.
		 * To make it work, we need to be consistent with that and always use
		 * lower case. We will fall back to the ID if a name is not provided,
		 * since we have to have a dataType.
		 */
		this.dataType = (this.name || this.id).toLowerCase();

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
	function ajaxTransportMiddleware(options) {
		return new Middleware(options);
	}

	ajaxTransportMiddleware.prototype = {

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

		toString: function() {
			return [
				'<ajaxTransportMiddleware: ',
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
	$.extend(ajaxTransportMiddleware, {
		DEFAULT_OPTIONS: {
			name: null,
			dataTypes: '*',

			filter: function() {
				return true;
			},

			modifyRequestHeaders: function(headers) {
				return headers;
			},

			modifyCompleteCallback: function(completeCallback) {
				return completeCallback;
			}
		},

		/**
		 * @param {String} name
		 *     the name of the middleware type in question.
		 * @param {boolean} [includeDeactivated=false]
		 *     whether or not to include disabled middleware in results
		 * @returns {ajaxTransportMiddleware[]}
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
		}
	});


	/* make sure that middleware objects are identified as such, whether
	 * created with new or not.
	 */
	Middleware.prototype = ajaxTransportMiddleware.prototype;

	/* Install for normal jQuery */
	$.ajaxTransportMiddleware = ajaxTransportMiddleware;

	/* Return for AMD */
	return ajaxTransportMiddleware;
},
this));
