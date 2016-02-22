# Generated on 2016-02-01 using generator-bower 0.0.1
'use strict'

mountFolder = (connect, dir) ->
    connect.static require('path').resolve(dir)

module.exports = (grunt) ->
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks)

  yeomanConfig =
    src: 'src'
    dist : 'dist'

  grunt.initConfig
    yeoman: yeomanConfig
    pkg: grunt.file.readJSON('package.json')
    
    coffee:
      dist:
        cwd: '<%= yeoman.src %>'
        files:
          '<%= yeoman.dist %>/conveyor.js' : [
            'src/base.coffee'
            'src/interface.coffee'
            'src/transformer.coffee'
            'src/facade.coffee'
            'src/*.coffee'
          ]
      playground:
        files:
          '<%= yeoman.dist %>/playground.js' : ['playground/{,*/}*.coffee']
    uglify:
      build:
        src: 'dist/conveyor.js'
        dest: '<%=yeoman.dist %>/conveyor.min.js'
    mochaTest:
      test: 
        options: 
          reporter: 'spec'
          compilers: 'coffee:coffee-script'
        src: ['test/**/*.coffee']
    watch:
      scripts:
        files: ['src/{,*/}*.coffee','playground/{,*/}*.coffee']
        tasks: ['coffee','uglify']
        options:
          spawn: false

    grunt.registerTask 'default', [
      # 'test'
      'coffee'
      'uglify'
    ]
    grunt.registerTask 'test', [
      'mochaTest'
    ]