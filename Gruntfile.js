/*
 * grunt-mkdocs-player
 * https://github.com/jwplayer/grunt-mkdocs-jwplayer
 *
 * Copyright (c) 2016 Matthew Martindale
 * Licensed under the none license.
 */

'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/*.js',
        '<%= nodeunit.tests %>'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    // Before generating any new files, remove any previously-created files.
    clean: {
      tests: ['tmp']
    },

    bump: {
      options: {
        files: ['package.json'],
        updateConfigs: ['pkg'],
        commit: false,
        createTag: false,
        push: false
      }
    },

    // Configuration to be run (and then tested).
    'mkdocs-jwplayer': {
      options: {
        isSource: true
      }
    },

    // Unit tests.
    nodeunit: {
      tests: ['test/*_test.js']
    }

  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  grunt.loadNpmTasks('grunt-bump');

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  grunt.registerTask('test', ['clean', 'mkdocs-jwplayer', 'nodeunit']);

  // By default, lint and run all tests.
  // grunt.registerTask('default', ['jshint', 'test']);
  grunt.registerTask('default', ['mkdocs-jwplayer']);

};
