gulp = require 'gulp'
watch = require 'gulp-watch'
stylus = require 'gulp-stylus'
coffee = require 'gulp-coffee'
concat = require 'gulp-continuous-concat'
uglify = require 'gulp-uglify'
livereload = require 'gulp-livereload'

gulp.task 'default', ->
  gulp.src ['**/*.coffee', '!node_modules/**', '!gulpfile.*']
    .pipe watch()
    .pipe coffee()
    .pipe concat('script.js')
    .pipe gulp.dest('.')
    .pipe livereload()

  gulp.src ['**/*.styl', '!node_modules/**']
    .pipe watch()
    .pipe stylus()
    .pipe concat('style.css')
    .pipe gulp.dest('.')
    .pipe livereload()
