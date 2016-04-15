'use strict';

var yamljs = require('yamljs');
var shelljs = require('shelljs');
var objectMerge = require('object-merge');

module.exports = function(grunt) {

  // surpress log headers for tasks occuring in plugin
  grunt.log.header = function() {};
  grunt.log.muted = true;

  // grunt.loadNpmTasks('grunt-http-server');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-watch');

  // default plugin config
  grunt.config('plugin', {
    siteDir: 'site',
    docsDir: 'docs',
    disable: [],
    server: {
      hostname: '127.0.0.1',
      port: 8000,
      root: 'site'
    }
  });

  var logrunt = {
    ok: function(msg) {
      grunt.log.muted = false;
      grunt.log.ok(msg);
      grunt.log.muted = true;
    },
    subhead: function(msg) {
      grunt.log.muted = false;
      grunt.log.subhead(msg);
      grunt.log.muted = true;
    },
    write: function(msg) {
      grunt.log.muted = false;
      grunt.log.write(msg);
      grunt.log.muted = true;
    },
    writeln: function(msg) {
      grunt.log.muted = false;
      grunt.log.writeln(msg);
      grunt.log.muted = true;
    }
  };

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
        logrunt.ok('Upgraded `mkdocs-jwplayer` theme package.');
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
    logrunt.ok('Documentation built.');
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
            onCreateServer: function(server, connect, options) {
              logrunt.ok('Serving `' + grunt.config('plugin.siteDir')
                + '` on http://'
                + grunt.config('plugin.server.hostname') + ':'
                + grunt.config('plugin.server.port') + '\n');
              logrunt.ok('Press CTRL-C to stop server.\n');
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
      logrunt.ok('Watching for documentation changes...');
    }
  });

  // local build process for the JW Player's custom MkDocs theme "mkdocs-jwplayer"
  grunt.registerTask('mkdocs-jwplayer', function() {

    // merge plugin config with any defined task options
    grunt.config('plugin', objectMerge(grunt.config('plugin'), this.options()));

    // initial message to user

    logrunt.subhead('Robot Matt is at your service...');

    logrunt.write('              ,\n'
      + '       __,.._; )\n'
      + '  ,--``\' / ,";,\\n'
      + '  |   __; `-\'   ;\n'
      + '  |```          ;                          _\n'
      + '  \'-""`!------\'/                      _,-\'`/\n'
      + '   "===`-\'"|_|"                 ____,(__,-\'\n'
      + '          (ctr`.________,,---``` ;__|\n'
      + '          | ,-"""""\-..._____,"""""-.\n'
      + '          |;;;\'\'\'\':::````:::; ;\'\'\'\': :\n'
      + '          (( .---.  ))     ( ( .---.) )\n'
      + '           : \    \ ;  ____ : /    / ;\n'
      + '            \ |````|\',-"----`-|    |\'\n'
      + '             (`----\'          `----\'\n'
      + '             /(____\          /____)\n'
      + '          ,-\ /   /          ,\    \\n'
      + '         (_ _/   /          (__\    \\n'
      + '          ,-\   /               ;-._ |\n'
      + '         (___)_/               (____\|');

    // run tasks
    grunt.task.run('get-mkdocs-yaml-config');
    grunt.task.run('upgrade-local-mkdocs-jwplayer-pypi-package');
    grunt.task.run('run-mkdocs-build');
    grunt.task.run('compile-custom-markdown');
    grunt.task.run('run-http-server');
    grunt.task.run('watch-for-modified-files');

  });

};
