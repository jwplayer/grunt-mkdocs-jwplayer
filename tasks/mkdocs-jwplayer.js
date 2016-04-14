/*
 * grunt-mkdocs-player
 * https://github.com/jwplayer/grunt-mkdocs-jwplayer
 *
 * Copyright (c) 2016 JW Player
 * Licensed under the none license.
 */

'use strict';

var server = require('http-server');
var cmd = require('shell-task');
var yamljs = require('yamljs');

module.exports = function(grunt) {

  // var config = {};
  // config.pkg = grunt.file.readJSON('package.json');
  // grunt.initConfig(config);

  // grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.registerTask('get-yml-config', function() {
    var yml = yamljs.load('mkdocs.yml');
    grunt.config('siteDir', yml.site_dir || 'site');
  });

  grunt.registerTask('http-server', function() {
    // server.createServer(options);
  });

  grunt.registerMultiTask('test', 'Build task for using JW Player\'s custom MkDocs theme `mkdocs-jwplayer` for product documentation.', function() {

    var options = this.options({

    });


    grunt.log.writeln('Building documentation...');

    this.files.forEach(function(f) {
      grunt.log.writeln(JSON.stringify(f, null, 2));
    });

    grunt.log.writeln(JSON.stringify(options, null, 2));

    grunt.task.run([
      'get-yml-config',
      'http-server'
    ]);

    /*
    // Merge task-specific and/or target-specific options with these defaults.
    var options = this.options({
      punctuation: '.',
      separator: ', '
    });

    // Iterate over all specified file groups.
    this.files.forEach(function(f) {
      // Concat specified files.
      var src = f.src.filter(function(filepath) {
        // Warn on and remove invalid source files (if nonull was set).
        if (!grunt.file.exists(filepath)) {
          grunt.log.warn('Source file "' + filepath + '" not found.');
          return false;
        } else {
          return true;
        }
      }).map(function(filepath) {
        // Read file source.
        return grunt.file.read(filepath);
      }).join(grunt.util.normalizelf(options.separator));

      // Handle options.
      src += options.punctuation;

      // Write the destination file.
      grunt.file.write(f.dest, src);

      // Print a success message.
      grunt.log.writeln('File "' + f.dest + '" created.');

    });

    */

    grunt.log.ok('Success!');

  });

  grunt.registerTask('mkdocs-jwplayer', function() {

    grunt.log.writeln('Building documentation...');

    grunt.task.run('get-yml-config');

  });

};
