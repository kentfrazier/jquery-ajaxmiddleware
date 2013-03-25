/*global module: false */
module.exports = function(grunt) {
    'use strict';

    grunt.initConfig({

        /* --- Package Metadata --- */
        pkg: grunt.file.readJSON('package.json'),
        banner: grunt.file.read('resources/templates/banner.template'),
        files: {
            test: {
                js: 'test/**.js',
                html: 'test/**.html'
            },
            src: {
                js: 'src/**.js'
            },
            gitHooks: 'git_hooks/*'
        },
        env: {
            browsertest: {
                hostname: '<%= process.env.' +
                    'AJAXMIDDLEWARE_BROWSERTEST_HOSTNAME' +
                    ' || "localhost" %>',
                port: '<%= process.env.' +
                    'AJAXMIDDLEWARE_BROWSERTEST_PORT' +
                    ' || 9005 %>',
                reloadPort: '<%= process.env.' +
                    'AJAXMIDDLEWARE_BROWSERTEST_RELOADPORT' +
                    ' || 9006 %>'
            }
        },

        /* --- Task Configuration --- */
        clean: {
            files: ['dist']
        },
        concat: {
            options: {
                stripBanners: true,
                banner: '<%= banner %>'
            },
            dist: {
                src: 'src/<%= pkg.name %>.js',
                dest: 'dist/<%= pkg.name %>-<%= pkg.version %>.js'
            }
        },
        uglify: {
            options: {
                banner: '<%= banner %>'
            },
            dist: {
                src: '<%= concat.dist.dest %>',
                dest: 'dist/<%= pkg.name %>-<%= pkg.version %>.min.js'
            }
        },
        qunit: {
            files: '<%= files.test.html %>'
        },
        jshint: {
            gruntfile: {
                options: {
                    jshintrc: '.jshintrc'
                },
                src: 'Gruntfile.js'
            },
            src: {
                options: {
                    jshintrc: '.jshintrc'
                },
                src: '<%= files.src.js %>'
            },
            test: {
                src: '<%= files.test.js %>'
            },
            gitHooks: {
                src: '<%= files.gitHooks %>'
            }
        },
        watch: {
            gruntfile: {
                files: '<%= jshint.gruntfile.src %>',
                tasks: ['jshint:gruntfile']
            },
            src: {
                files: '<%= files.src.js %>',
                tasks: ['jshint:src', 'qunit']
            },
            test: {
                files: '<%= files.test.js %>',
                tasks: ['jshint:test', 'qunit']
            },
            browsertest: {
                files: [
                    '<%= files.src.js %>',
                    '<%= files.test.js %>',
                    '<%= files.test.html %>'
                ],
                tasks: ['jshint:src', 'jshint:test', 'reload:browsertest']
            }
        },
        connect: {
            browsertest: {
                options: {
                    port: '<%= env.browsertest.port %>',
                    hostname: '<%= env.browsertest.hostname %>'
                }
            }
        },
        reload: {
            browsertest: {
                port: '<%= env.browsertest.reloadPort %>',
                proxy: {
                    port: '<%= connect.browsertest.options.port %>',
                    hostname: '<%= connect.browsertest.options.hostname %>'
                }
            }
        }
    });

    /* --- Load Plugin Tasks --- */
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-reload');

    /* --- Define Tasks --- */
    grunt.registerTask(
        'test',
        ['jshint', 'qunit']
    );
    grunt.registerTask(
        'browsertest',
        ['connect:browsertest', 'reload:browsertest', 'watch:browsertest']
    );
    grunt.registerTask(
        'default',
        ['jshint', 'qunit', 'clean', 'concat', 'uglify']
    );
};
