var gulp         = require('gulp');
var browserSync  = require('browser-sync');
var handleErrors = require('../util/handleErrors');
var jade         = require('gulp-jade');
var config       = require('../config').jade;


gulp.task('jade', function() {
	return gulp.src(config.src)
		.pipe(jade())
		.on('error', handleErrors)
		.pipe(gulp.dest(config.dest))
		.pipe(browserSync.reload({stream:true}))
		;
});
