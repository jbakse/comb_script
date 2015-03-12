var gulp = require('gulp');
var config = require('../config').markup;
var browserSync  = require('browser-sync');

var build = require('gulp-build');
var fileinclude = require('gulp-file-include');
var package_info = require ('../../package.json');

gulp.task('markup', function() {
  return gulp.src(config.src)
  	.pipe(fileinclude())
  	.pipe(build(package_info))
    .pipe(gulp.dest(config.dest))
    .pipe(browserSync.reload({stream:true}));
});
