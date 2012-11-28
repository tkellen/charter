'use strict';

module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-contrib-yuidoc');

  grunt.initConfig({

    pkg: '<json:package.json>',

    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      all: ['Gruntfile.js', 'lib/**/*.js', 'test/**/*.js']
    },

    requirejs: {
      options: {
        baseUrl: "./lib",
        name: "../vendor/almond",
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
      },
      dev: {
        options: {
          optimize: "none",
          out: "./dist/charter.js"
        }
      },
      prod: {
        options: {
          out: "./dist/charter.min.js"
        }
      }
    },

    compress: {
      charter: {
        options: { mode: 'gzip' },
        files: {
          "dist/charter.min.gz": "dist/charter.min.js"
        }
      }
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

  grunt.registerTask('default', ['jshint', 'requirejs', 'compress', 'yuidoc']);
};
