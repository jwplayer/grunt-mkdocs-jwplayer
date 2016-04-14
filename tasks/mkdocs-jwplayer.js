/*
 * grunt-mkdocs-player
 * https://github.com/jwplayer/grunt-mkdocs-jwplayer
 *
 * Copyright (c) 2016 JW Player
 * Licensed under the none license.
 */

'use strict';

var httpServer = require('http-server');
var yamljs = require('yamljs');
var shelljs = require('shelljs');

module.exports = function(grunt) {

  var config = {};
  var options = {};

  // local build process for the JW Player's custom MkDocs theme "mkdocs-jwplayer"
  grunt.registerTask('mkdocs-jwplayer', function() {

    // default options
    options = this.options({
      disable: [],
      server: {
        host: '127.0.0.1',
        port: 8282,
        runInBackground: true
      }
    });

    // initial message
    grunt.log.writeln('Building documentation...');

    // read mkdocs yaml file and convert to json and make data accessible
    var mkdocsYml = yamljs.load('mkdocs.yml');
    config['siteDir'] = mkdocsYml.site_dir || 'site';

    // every hour, local theme package will attempt to upgrade based on the
    // value stored in `.local-mkdocs-jwplayer-last-updated`, which is created
    // if it does not already exist
    if (options.disable.indexOf('upgrade-local-mkdocs-jwplayer-pypi-package') == -1) {
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
        shelljs.exec('pip install mkdocs-jwplayer --upgrade --force-reinstall', {
          silent: true
        });
        grunt.file.write('.local-mkdocs-jwplayer-last-updated', now);
      }
    }

    // run mkdocs build process
    shelljs.exec('mkdocs build', {
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
      shelljs.exec('node_modules/http-server/bin/http-server ' + config['siteDir'] + ' -p 8282 -a 127.0.0.1');
      // listen for modified files that trigger rebuild while serving localhost
      grunt.log.writeln('watch files here');
    }

    // grunt.log.ok('Success!');

  });

};
