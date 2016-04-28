'use strict';

module.exports = function(grunt) {

  // configure grunt
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    bump: {
      options: {
        files: ['package.json'],
        updateConfigs: ['pkg'],
        commit: false,
        createTag: false,
        push: false
      }
    },
    'mkdocs-jwplayer': {
      options: {
        isSource: true
      }
    }
  });

  // load this plugin's tasks
  grunt.loadTasks('tasks');

  // load other plugins
  grunt.loadNpmTasks('grunt-bump');

  // default task runner
  grunt.registerTask('default', ['mkdocs-jwplayer']);

};
