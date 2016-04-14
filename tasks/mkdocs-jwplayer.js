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
var shell = require('shelljs');

module.exports = function(grunt) {

  var config = {};
  var options = {};

  // local build process for the JW Player's custom MkDocs theme "mkdocs-jwplayer"
  grunt.registerTask('mkdocs-jwplayer', function() {

    // default options
    options = this.options({
      disable: []
    });

    // initial message
    grunt.log.writeln('Building documentation...');

    // read mkdocs yaml file and convert to json and make data accessible
    var obj = yaml.load('mkdocs.yml');
    config['siteDir'] = obj.site_dir || 'site';

    // every hour, local theme package will attempt to upgrade based on the
    // value stored in `.local-mkdocs-jwplayer-last-updated`, which is created
    // if it does not already exist
    if (options.disable.indexOf('upgrade-local-mkdocs-jwplayer-pypi-package') == -1) {
      grunt.log.writeln('upgrade-local-mkdocs-jwplayer-pypi-package');
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
        shell.exec('pip install mkdocs-jwplayer --upgrade --force-reinstall', {
          silent: true
        });
        grunt.file.write('.local-mkdocs-jwplayer-last-updated', now);
      }
    }

    // run mkdocs build process
    shell.exec('mkdocs build', {
      silent: true
    });

    // look for and compile custom markdown
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

    if (options.disable.indexOf('run-http-server') == -1) {
      // run localhost server
      grunt.log.writeln('run server here');
      // listen for modified files that trigger rebuild while serving localhost
      grunt.log.writeln('watch files here');
    }

    // grunt.log.ok('Success!');

  });

};
