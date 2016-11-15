'use strict';

var gulp = require('gulp'),
        sass = require('gulp-ruby-sass'),
        autoprefixer = require('gulp-autoprefixer'),
        minifycss = require('gulp-minify-css'),
        rename = require('gulp-rename');

gulp.task('express', function() {
  var express = require('express');
  var app = express();
  app.use(require('connect-livereload')({port: 35729}));
  app.use(express.static(__dirname));
  app.listen(4000, '0.0.0.0');
});

var tinylr;
gulp.task('livereload', function() {
  tinylr = require('tiny-lr')();
    tinylr.listen(35729);
});

function notifyLiveReload(event) {
  var fileName = require('path').relative(__dirname, event.path);

  tinylr.changed({
    body: {
      files: [fileName]
    }
  });
}

//
//gulp.task('libsass', function () {
//      gulp.src('*.scss')
//          .pipe(sass({errLogToConsole: true}))
//          .pipe(gulp.dest('../css'))
//  });

gulp.task('sass', function () {
  return sass('./assets/sass/*.scss')
    .on('error', sass.logError)
    .pipe(gulp.dest('./assets/css/'));
});

//gulp.task('styles', function() {
//    console.log("styles");
//  return sass('sass', { style: 'expanded' })
//    .pipe(gulp.dest('../css'))
//    .pipe(rename({suffix: '.min'}))
//    .pipe(minifycss())
//    .pipe(gulp.dest('../css'));
//});

gulp.task('watch', function() {
  gulp.watch('assets/sass/*.scss', ['sass']);
  gulp.watch('*.html', notifyLiveReload);
  gulp.watch('assets/javascripts/*.js', notifyLiveReload);
  gulp.watch('assets/css/*.css', notifyLiveReload);
});

gulp.task('default', ['sass', 'express', 'livereload', 'watch'], function() {
    
});