var gulp         = require('gulp');
var browserSync  = require('browser-sync');
var handleErrors = require('../util/handleErrors');
var jade         = require('gulp-jade');
var config       = require('../config').jade;

var build = require('gulp-build');
var package_info = require ('../../package.json');

gulp.task('jade', function() {
	return gulp.src(config.src)
		.pipe(jade())
		.on('error', handleErrors)
		// .pipe(build(package_info))
		.pipe(gulp.dest(config.dest))
		.pipe(browserSync.reload({stream:true}))
		;
});
