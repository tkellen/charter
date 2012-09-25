module.exports = function(grunt) {

  // configure Grunt
  grunt.initConfig({

    pkg: '<json:package.json>',
    requirejs: {
      compile: {
        options: {
          baseUrl: "./lib",
          name: "../vendor/almond",
          optimize: "none",
          include: ['charter'],
          wrap: {
            start: "(function (root, factory) {\n"+
                   "  if (typeof exports === 'object') {\n"+
                   "    module.exports = factory(); // node\n"+
                   "  } else if (typeof define === 'function' && define.amd) {\n"+
                   "    define(factory); // amd\n"+
                   "  } else {\n"+
                   "    root.Charter = factory(); // browser\n"+
                   "  }\n"+
                   "}(this, function () {\n",
            end: "  return require('charter');\n"+
                 "}));"
          },
          out: "./dist/charter.js"
        }
      }
    },
    lint: {
      all: ['lib/**/*.js']
    },
    // minify the optimized library file
    min: {
      "dist/charter.min.js": "dist/charter.js"
    },
    compress: {
      charter: {
        options: { mode: 'gzip' },
        files: {
          "dist/charter.min.gz": "dist/charter.min.js"
        }
      }
    },
    // kick off jasmine, showing results at the cli
    jasmine: {
      all: ['test/runner.html']
    },
    // run jasmine tests any time watched files change
    watch: {
      files: ['lib/**/*','test/spec/**/*'],
      tasks: ['jasmine']
    },
    yuidoc: {
      compile: {
        "name": "<%= pkg.name %>",
        "description": "<%= pkg.description %>",
        "version": "<%= pkg.version %>",
        "url": "<%= pkg.url %>",
        options: {
          paths: "lib/",
          outdir: "docs/"
        }
      }
    }
  });

  // Load external tasks
  grunt.loadNpmTasks('grunt-contrib-yuidoc');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-jasmine-task');

  // Make task shortcuts
  grunt.registerTask('default', 'jasmine requirejs min compress yuidoc');
  grunt.registerTask('test', 'jasmine');

};
