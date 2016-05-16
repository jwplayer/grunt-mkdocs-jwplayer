'use strict';

var yamljs = require('yamljs');
var shelljs = require('shelljs');
var objectMerge = require('object-merge');

module.exports = function(grunt) {

  // surpress log headers for tasks occuring in plugin
  // grunt.log.header = function() {};
  // grunt.log.muted = true;

  // load grunt plugins
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-watch');

  // default plugin config
  grunt.config('plugin', {
    siteDir: 'site',
    docsDir: 'docs',
    isSource: false,
    serve: false
  });

  // shh
  var shh = {
    mute: function() {
      grunt.log.muted = true;
    },
    unmute: function() {
      grunt.log.muted = false;
    },
    json: function(msg) {
      grunt.log.muted = false;
      grunt.log.writeln(JSON.stringify(msg, null, 2));
      grunt.log.muted = true;
    },
    ok: function(msg) {
      grunt.log.muted = false;
      grunt.log.ok(msg || '');
      grunt.log.muted = true;
    },
    error: function(msg) {
      grunt.log.muted = false;
      grunt.log.error(msg || '');
      grunt.log.muted = true;
    },
    header: function(msg) {
      grunt.log.muted = false;
      grunt.log.header('\n' + (msg || ''));
      grunt.log.muted = true;
    },
    subhead: function(msg) {
      grunt.log.muted = false;
      grunt.log.subhead(msg || '');
      grunt.log.muted = true;
    },
    write: function(msg) {
      grunt.log.muted = false;
      grunt.log.write(msg || '');
      grunt.log.muted = true;
    },
    writeln: function(msg) {
      grunt.log.muted = false;
      grunt.log.writeln(msg || '');
      grunt.log.muted = true;
    }
  };

  // read mkdocs yaml file and convert to json and make data accessible
  grunt.registerTask('get-mkdocs-yaml-config', function() {
    if (!grunt.config('plugin.isSource')) {
      var mkdocsYml = yamljs.load('mkdocs.yml');
      var siteDir = mkdocsYml.site_dir || grunt.config('plugin.siteDir');
      grunt.config('plugin.serve.root', siteDir);
      grunt.config('plugin.siteDir', siteDir);
      grunt.config('plugin.docsDir', siteDir);
    }
  });

  // self-update package if a newer version is available
  grunt.registerTask('self-update', function() {
    if (!grunt.config('plugin.isSource')) {
      if (grunt.file.exists('.self-update-info')) {
        var info = grunt.file.readJSON('.self-update-info');
        grunt.config('plugin.selfUpdateInfo', {
          'grunt-mkdocs-jwplayer': info['grunt-mkdocs-jwplayer'] || 0,
          'mkdocs-jwplayer': info['mkdocs-jwplayer'] || 0
        });
      } else {
        grunt.config('plugin.selfUpdateInfo', {
          'grunt-mkdocs-jwplayer': 0,
          'mkdocs-jwplayer': 0
        });
      }
      var now = Math.floor(Date.now() / 1000);
      var oneHourAgo = now - 3600;
      if (oneHourAgo > grunt.config('plugin.selfUpdateInfo.grunt-mkdocs-jwplayer')) {
        grunt.config('plugin.selfUpdateInfo.grunt-mkdocs-jwplayer', now);
        shh.writeln('Upgrading `grunt-mkdocs-jwplayer` Grunt plugin. Please wait...');
        shelljs.exec('npm update grunt-mkdocs-jwplayer', {
          silent: true
        });
        shh.ok('Upgrade complete');
      }
      if (oneHourAgo > grunt.config('plugin.selfUpdateInfo.mkdocs-jwplayer')) {
        grunt.config('plugin.selfUpdateInfo.mkdocs-jwplayer', now);
        shh.writeln('Upgrading `mkdocs-jwplayer` theme package. Please wait...');
        shelljs.exec('pip install git+ssh://git@github.com/jwplayer/mkdocs-jwplayer@master#egg=jwplayer --upgrade --force-reinstall', {
          silent: true
        });
        shh.ok('Upgrade complete');
      }
      grunt.file.write('.self-update-info', JSON.stringify(grunt.config('plugin.selfUpdateInfo')));
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
    grunt.file.recurse(grunt.config('plugin.siteDir'), function callback(absPath, rootDir, subDir, filename) {
      if (filename.substr(filename.length - 4) == 'html') {
        var html = grunt.file.read(absPath);
        html = html.replace(/<\w+>\s?\^{3}([\s\S]*?)\^{3}\s?<\/\w+>/g, function(match, cg1, offset, str) {
          return '<div class="output">' + cg1.trim() + '</div>';
        });
        html = html.replace(/<.+>\s?\!{3}([a-z]+)?([\s\S]*?)\!{3}\s?<\/.+>/g, function(match, cg1, cg2, offset, str) {
          cg1 = cg1 || 'default';
          return '<div class="alert ' + cg1.trim() + '">' + cg2.trim() + '</div>';
        });
        grunt.file.write(absPath, html);
      }
    });
    shh.ok('Documentation built');
  });

  // run localhost server is serve option is configured
  grunt.registerTask('run-server', function(port) {
    if (grunt.config('plugin.serve')) {
      grunt.config('connect', {
        server: {
          options: {
            hostname: grunt.config('plugin.serve.hostname'),
            port: grunt.config('plugin.serve.port'),
            base: grunt.config('plugin.serve.root'),
            useAvailablePort: true,
            open: true,
            onCreateServer: function(server, connect, options) {
              shh.ok('Now serving `' + grunt.config('plugin.siteDir') + '`');
              shh.ok('Press CTRL-C to stop server');
            }
          }
        }
      });
      grunt.task.run('connect');
    }
  });

  // watch for modified files that impact documentation build and rebuild
  // documentation if something is detected
  grunt.registerTask('watch-for-modified-files', function() {
    if (grunt.config('plugin.serve')) {
      grunt.config('watch', {
        files: ['**/*.md', 'mkdocs.yml', 'src', 'jwplayer'],
        tasks: [
          'self-update',
          'write-rebuilding-docs-message',
          'get-mkdocs-yaml-config',
          'run-mkdocs-build',
          'compile-custom-markdown',
          'write-waiting-for-changes-message'
        ]
      });
      grunt.task.run('write-waiting-for-changes-message');
      grunt.task.run('watch');
    }
  });

  // message to display during initial documentation build
  grunt.registerTask('write-building-docs-message', function() {
    shh.writeln('Building documentation...');
  });

  // message to display when watch event occurs
  grunt.registerTask('write-rebuilding-docs-message', function() {
    shh.writeln('Rebuilding documentation...');
  });

  // message to display when waiting for changes
  grunt.registerTask('write-waiting-for-changes-message', function() {
    shh.writeln('Watching for documentation changes...');
  });

  // local build process for the JW Player's custom MkDocs theme "mkdocs-jwplayer"
  grunt.registerMultiTask('mkdocs-jwplayer', function() {

    // merge plugin config with any defined task options
    grunt.config('plugin', objectMerge(grunt.config('plugin'), this.options()));

    // if serve task option was set to true, use default settings
    if (grunt.config('plugin.serve') === true) {
      grunt.config('plugin.serve', {
        hostname: '127.0.0.1',
        port: 8000,
        root: 'site'
      });
    }

    // initial messages to user
    shh.header('Running "mkdocs-jwplayer" task');

    // run tasks
    grunt.task.run('get-mkdocs-yaml-config');
    grunt.task.run('self-update');
    grunt.task.run('write-building-docs-message');
    grunt.task.run('run-mkdocs-build');
    grunt.task.run('compile-custom-markdown');
    grunt.task.run('run-server');
    grunt.task.run('watch-for-modified-files');

  });

};
