(function() {

  'use strict';

  /**
   * Requirements
   */
  var gulp = require('gulp');
  var browserify = require('gulp-browserify');
  var autoprefixer = require('gulp-autoprefixer');
  var cssmin = require('gulp-cssmin');
  var header = require('gulp-header');
  var mocha = require('gulp-mocha');
  var notify = require("gulp-notify");
  var pkg = require('./package.json');
  var rename = require('gulp-rename');
  var sass = require('gulp-sass');
  var shell = require('gulp-shell');

  /**
   * Banner
   */
  var banner = ['/**',
    ' * <%= pkg.name %> - <%= pkg.description %>',
    ' * @version v<%= pkg.version %>',
    ' * @link <%= pkg.homepage %>',
    ' * @license <%= pkg.license %>',
    ' */',
    ''].join('\n');

  /**
   * Paths
   */
  var paths = {
    sass: ['./src/sass/*.scss'],
    scripts: ['./gulpfile.js', './src/scripts/*.js'],
    clientTestScripts: ['./client/components/**/*.spec.js'],
    serverTestScripts: ['./server/api/**/*.spec.js']
  };

  /**
   * CSS compilation
   */
  gulp.task('styles', function() {
    return gulp.src(paths.sass)
      .pipe(sass({
        outputStyle: 'expanded'
      }))
      .on('error', notify.onError({
        title: 'Error compiling Sass',
        message: 'Check the console for info'
      }))
      .on('error', sass.logError)
      .pipe(autoprefixer())
      .pipe(gulp.dest('./public/css'))
      .pipe(cssmin())
      .pipe(header(banner, {pkg: pkg}))
      .pipe(rename({suffix: '.min'}))
      .pipe(gulp.dest('./public/css'));
  });

  /**
   * Styles watcher
   */
  gulp.task('watchStyles', function() {
    gulp.watch(paths.sass, ['styles']);
  });

  /**
   * Browserify
   */
  // gulp.task('browserify', function() {
  //   return gulp.src('src/scripts/issueexplorer.js')
  //   .pipe(browserify({
  //     insertGlobals : true
  //   }))
  //   .on('prebundle', function(bundle) {
  //     bundle.external('domready');
  //     bundle.external('react');
  //   })
  //   .pipe(rename('bundle.js'))
  //   .pipe(gulp.dest('./public/scripts'));
  // });
  
  gulp.task('browserify', shell.task([
    'browserify -t [ babelify --presets [ react ] ] ./src/scripts/issueexplorer.js -o ./public/scripts/bundle.js'
  ]));

  /**
   * JavsScript watcher
   */
  gulp.task('watchScripts', function() {
    gulp.watch('src/scripts/issueexplorer.js', ['browserify']);
  });

  /**
   * Client side tests using karma
   */
  gulp.task('clientTests', shell.task([
    'karma start'
  ]));

  /**
   * Server side testing using mocha directly
   */
  gulp.task('serverTests', function () {
    return gulp.src(paths.serverTestScripts, {read: false})
      .pipe(mocha({reporter: 'spec'}));
  });

  /**
   * Final tasks - these are the tasks that should be run from the command line,
   * as they encompass the above.
   */
  gulp.task('default', ['styles', 'watchStyles', 'watchScripts']);
  gulp.task('styles:dev', ['styles', 'watchStyles']);
  gulp.task('scripts:dev', ['watchScripts']);
  gulp.task('test:client', ['clientTests']);
  gulp.task('test:server', ['serverTests']);
  gulp.task('test', ['clientTests', 'serverTests']);

})();