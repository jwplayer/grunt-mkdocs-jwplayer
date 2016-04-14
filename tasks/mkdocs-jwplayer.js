/*
 * grunt-mkdocs-player
 * https://github.com/jwplayer/grunt-mkdocs-jwplayer
 *
 * Copyright (c) 2016 JW Player
 * Licensed under the none license.
 */

'use strict';

var server = require('http-server');
var yaml = require('yamljs');
require('shelljs/global');

module.exports = function(grunt) {

  var config = {};
  var options = {};

  // run localhost server
  grunt.registerTask('run-http-server', function() {
    if (options.disable.indexOf('run-http-server') != -1) {
       return;
    }
    grunt.log.writeln('run server here');
    // server.createServer(options);
  });

  // listen for modified files that trigger rebuild while serving localhost
  grunt.registerTask('listen-for-modified-files', function() {
    if (options.disable.indexOf('run-http-server') != -1) {
       grunt.log.writeln('watch files here');
    }
  });

  // read mkdocs yaml file and convert to json and make data accessible
  grunt.registerTask('get-yml-config', function() {
    var obj = yaml.load('mkdocs.yml');
    config['siteDir'] = obj.site_dir || 'site';
  });

  // every hour, local theme package will attempt to upgrade based on the
  // value stored in `.local-mkdocs-jwplayer-last-updated`, which is created
  // if it does not already exist
  grunt.registerTask('upgrade-local-mkdocs-jwplayer-pypi-package', function() {
    if (options.disable.indexOf('upgrade-local-mkdocs-jwplayer-pypi-package') != -1) {
       return;
    }
    if (grunt.file.exists('.local-mkdocs-jwplayer-last-updated')) {
      var lastUpdated = grunt.file.read('.local-mkdocs-jwplayer-last-updated').trim();
      config['localThemeLastUpdated'] = lastUpdated;
    } else {
      grunt.file.write('.local-mkdocs-jwplayer-last-updated', 0);
      config['localThemeLastUpdated'] = 0;
    }
    var now = Math.floor(Date.now() / 1000);
    var oneHourAgo = now - 3600;
    if (oneHourAgo > config['localThemeLastUpdated']) {
      config['localThemeLastUpdated'] = now;
      exec('pip install mkdocs-jwplayer --upgrade --force-reinstall');
      grunt.file.write('.local-mkdocs-jwplayer-last-updated', now);
    }
  });

  // run mkdocs build process
  grunt.registerTask('run-mkdocs-build', function() {
    exec('mkdocs build');
  });

  // look for and compile custom markdown
  grunt.registerTask('compile-custom-markdown', function() {
    grunt.file.recurse(config['siteDir'], function callback(absPath, rootDir, subDir, filename) {
      if (filename.substr(filename.length - 4) == 'html') {
        var html = grunt.file.read(absPath);
        html = html.replace(/(\<[\s\S]\>){1}?(\^\^\^([\s\S]*?)\^\^\^)(<\/[\s\S]\>){1}?/g, function(match, g1, g2, g3, g4, offset, str) {
          return '<div class="output">' + g3.trim() + '</div>';
        });
        html = html.replace(/(\<[\s\S]\>){1}?(\!\!\!([a-z]+)([\s\S]*?)\!\!\!)(<\/[\s\S]\>){1}?/g, function(match, g1, g2, g3, g4, g5, offset, str) {
          return '<div class="alert ' + g3.trim() + '">' + g4.trim() + '</div>';
        });
        grunt.file.write(absPath, html);
      }
    });
  });

  // local build process for the JW Player's custom MkDocs theme "mkdocs-jwplayer"
  grunt.registerTask('mkdocs-jwplayer', function() {

    options = this.options({
      disable: []
    });

    grunt.log.writeln('Building documentation...');

    grunt.task.run([
      'get-yml-config',
      'upgrade-local-mkdocs-jwplayer-pypi-package',
      'run-mkdocs-build',
      'compile-custom-markdown'
    ]);

    // grunt.log.ok('Success!');

  });

};
