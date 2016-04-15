'use strict';

var yamljs = require('yamljs');
var shelljs = require('shelljs');

module.exports = function(grunt) {

  // grunt.loadNpmTasks('grunt-http-server');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-watch');

  // read mkdocs yaml file and convert to json and make data accessible
  grunt.registerTask('get-mkdocs-yaml-config', function() {
    var mkdocsYml = yamljs.load('mkdocs.yml');
    grunt.config('plugin.siteDir', mkdocsYml.site_dir || grunt.config('plugin.siteDir'));
    grunt.config('plugin.docsDir', mkdocsYml.docs_dir || grunt.config('plugin.docsDir'));
  });

  // every hour, local theme package will attempt to upgrade based on the
  // value stored in `.local-mkdocs-jwplayer-last-updated`, which is created
  // if it does not already exist
  grunt.registerTask('upgrade-local-mkdocs-jwplayer-pypi-package', function() {
    if (grunt.config('plugin.disable').indexOf('upgrade-local-mkdocs-jwplayer-pypi-package') == -1) {
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
  });

  // run mkdocs build process
  grunt.registerTask('run-mkdocs-build', function() {
    shelljs.exec('mkdocs build', {
      silent: true
    });
  });

  // look for and compile custom markdown
  grunt.registerTask('compile-custom-markdown', function() {
    grunt.log.writeln(grunt.config('plugin.siteDir'));
    grunt.file.recurse(grunt.config('plugin.siteDir'), function callback(absPath, rootDir, subDir, filename) {
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

  grunt.registerTask('run-http-server', function() {
    if (grunt.config('plugin.disable').indexOf('run-http-server') == -1) {
      grunt.config('connect', {
        server: {
          options: {
            hostname: grunt.config('plugin.server.hostname'),
            port: grunt.config('plugin.server.port'),
            base: grunt.config('plugin.server.root'),
            useAvailablePort: true,
            open: true,
            livereload: true,
            onCreateServer: function(server, connect, options) {
              grunt.log.ok('Serving `' + grunt.config('plugin.siteDir')
                + '` on http://'
                + grunt.config('plugin.server.hostname') + ':'
                + grunt.config('plugin.server.port'));
              grunt.log.writeln('Press CTRL-C to stop server.');
            }
          }
        }
      });
      grunt.task.run('connect');
    }
  });

  grunt.registerTask('watch-for-modified-files', function() {
    if (grunt.config('plugin.disable').indexOf('run-http-server') == -1) {
      grunt.config('watch', {
        files: ['**/*.md', 'mkdocs.yml'],
        tasks: [
          'get-mkdocs-yaml-config',
          'run-mkdocs-build',
          'compile-custom-markdown'
        ]
      });
      grunt.task.run('watch');
    }
  });

  // local build process for the JW Player's custom MkDocs theme "mkdocs-jwplayer"
  grunt.registerTask('mkdocs-jwplayer', function() {

    // surpress log headers for tasks occuring in plugin
    grunt.log.header = function() {};

    // default options
    grunt.config('plugin', this.options({
      siteDir: 'site',
      docsDir: 'docs',
      disable: [],
      server: {
        hostname: '127.0.0.1',
        port: 8000,
        root: 'site'
      }
    }));

    // initial message
    grunt.log.writeln('Robot Matt is building your documentation... fleep florp flarp...');

    // run tasks
    grunt.task.run('get-mkdocs-yaml-config');
    grunt.task.run('upgrade-local-mkdocs-jwplayer-pypi-package');
    grunt.task.run('run-mkdocs-build');
    grunt.task.run('compile-custom-markdown');
    grunt.task.run('run-http-server');
    grunt.task.run('watch-for-modified-files');

  });

};
