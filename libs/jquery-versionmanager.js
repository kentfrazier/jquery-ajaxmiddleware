/*global define: false, window: false, require: false */
define(function() {
    'use strict';

    var ALL_VERSIONS = [
        '1.5.1',
        '1.5.2',
        '1.6.1',
        '1.6.2',
        '1.6.3',
        '1.6.4',
        '1.7.1',
        '1.7.2',
        '1.8.0',
        '1.8.1',
        '1.8.2',
        '1.8.3',
        '1.9.0',
        '1.9.1'
    ].sort().reverse();

    // Default to newest
    var DEFAULT_VERSION = ALL_VERSIONS[0];
    var version = DEFAULT_VERSION;

    var versionManager = {
        requestedVersions: function() {
            var versions = [];
            var matches = window.location.search.match(
                /[?&]jquery=[^\?&]+/g
            );
            for (var i = 0; matches && i < matches.length; ++i) {
                versions.push(matches[i].split('=')[1]);
            }
            if (!versions.length) {
                return ALL_VERSIONS;
            }
            return versions.sort().reverse();
        },

        version: function() {
            return version;
        },

        setVersion: function(newVersion) {
            version = newVersion;
            require.undef('jquery');
            require.undef('jquery-source');
            require.undef('text!jquery-source');
            require.config({
                paths: {
                    'jquery': this.requirePath(),
                    'jquery-source': this.url(),
                },
                shim: {
                    jquery: {
                        exports: '$',
                        init: function() {
                            return window.$.noConflict(true);
                        }
                    }
                }
            });
        },

        url: function() {
            return this.requirePath() + '.js';
        },

        requirePath: function() {
            return 'libs/jquery/jquery-' + version;
        }

    };

    return versionManager;
});
