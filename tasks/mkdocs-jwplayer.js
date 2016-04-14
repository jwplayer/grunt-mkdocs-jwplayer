/*
 * grunt-mkdocs-player
 * https://github.com/jwplayer/grunt-mkdocs-jwplayer
 *
 * Copyright (c) 2016 JW Player
 * Licensed under the none license.
 */

'use strict';

var server = require('http-server');
var command = require('shell-task');
var yaml = require('yamljs');

module.exports = function(grunt) {

  // var config = {};
  // config.pkg = grunt.file.readJSON('package.json');
  // grunt.initConfig(config);

  // grunt.loadNpmTasks('grunt-contrib-clean');

  var config = {};
  var options = {};

  // run localhost server
  grunt.registerTask('http-server', function() {
    if (options.indexOf('http-server') != -1) {
       return;
    }
    grunt.log.writeln('run server here');
    // server.createServer(options);
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
    if (options.indexOf('upgrade-local-mkdocs-jwplayer-pypi-package') != -1) {
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
      new command('pip install mkdocs-jwplayer --upgrade --force-reinstall');
      grunt.file.write('.local-mkdocs-jwplayer-last-updated', now);
    }
  });

  // run mkdocs build process
  grunt.registerTask('run-mkdocs-build', function() {
    new command('mkdocs build');
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
  grunt.registerMultiTask('mkdocs-jwplayer', function() {

    options = this.options({
      disable: []
    });

    // var options = this.options({
    //
    // });

    // grunt.log.writeln('Building documentation...');
    //
    // this.files.forEach(function(f) {
    //   grunt.log.writeln(JSON.stringify(f, null, 2));
    // });
    //
    // grunt.log.writeln(JSON.stringify(options, null, 2));

    // default
    grunt.task.run([
      'upgrade-local-mkdocs-jwplayer-pypi-package',
      'run-mkdocs-build',
      'compile-custom-markdown'
    ]);

    // serve
    /*
    'config-site-dir',
    'http-server:serve',
    'grunt:build',
    'copy:build',
    'less:build',
    'postcss:build',
    'cssmin:build',
    'shell:mkdocsBuild',
    'compileCustomMarkdown',
    'watch:modifiedMarkdown',
    'message'
    */

    // serve
    // grunt.task.run([
    //   'upgrade-local-mkdocs-jwplayer-pypi-package',
    //   'get-yml-config',
    //   'run-mkdocs-build',
    //   'compile-custom-markdown',
    //   'http-server',
    //   '_____watch_____'
    // ]);

    grunt.log.ok('Success!');

  });

};
