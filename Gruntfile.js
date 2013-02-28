/*global module: false */
module.exports = function(grunt) {
	'use strict';

	grunt.initConfig({

		/* --- Package Metadata --- */
		pkg: grunt.file.readJSON('package.json'),
		banner: grunt.file.read('banner.template'),

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
				dest: 'dist/jquery.<%= pkg.name %>-<%= pkg.version %>.js'
			}
		},
		uglify: {
			options: {
				banner: '<%= banner %>'
			},
			dist: {
				src: '<%= concat.dist.dest %>',
				dest: 'dist/jquery.<%= pkg.name %>-<%= pkg.version %>.min.js'
			}
		},
		qunit: {
			files: ['test/**/*.html']
		},
		jshint: {
			options: {
				jshintrc: '.jshintrc'
			},
			gruntfile: {
				src: 'Gruntfile.js'
			},
			src: {
				src: ['src/**/*.js']
			},
			test: {
				src: ['test/**/*.js']
			}
		},
		watch: {
			gruntfile: {
				files: '<%= jshint.gruntfile.src %>',
				tasks: ['jshint:gruntfile']
			},
			src: {
				files: '<%= jshint.src.src %>',
				tasks: ['jshint:src', 'qunit']
			},
			test: {
				files: '<%= jshint.test.src %>',
				tasks: ['jshint:test', 'qunit']
			}
		}
	});

	/* --- Load Plugin Tasks --- */
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-qunit');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-watch');

	/* --- Define Tasks --- */
	grunt.registerTask(
		'default',
		['jshint', 'qunit', 'clean', 'concat', 'uglify']
	);

};
