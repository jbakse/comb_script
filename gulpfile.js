// Include Gulp
var gulp = require('gulp'); 

// Include Plugins
// var plumber = require('gulp-plumber');
var watch = require('gulp-watch');
var rename = require('gulp-rename');
var plumber = require('gulp-plumber');
var livereload = require('gulp-livereload');
var browserify = require('gulp-browserify');


gulp.task('javascript', function() {
	return gulp
		.src('./src/javascript/main.js', {read: false})
		.pipe(plumber())
		.pipe( browserify({
			debug: true,
			// transform: ['coffeeify'],
			// extensions: ['.js']
		}))
		.pipe(rename('app.js'))
		.pipe(gulp.dest('./build/javascript/'))
		.pipe(livereload())
		;
});

gulp.task('html', function() {
	return gulp.src('./src/*.html')
		.pipe(gulp.dest('./build/'))
		.pipe(livereload())
		;
});



//Watch Files For Changes
gulp.task('watch', function() {

	gulp.watch('./src/javascript/*.js', ['javascript']);
	gulp.watch('./src/*.html', ['html']);
	gulp.watch('yaml/*.*').on('change', function(file) {livereload().changed(file.path);});

});

// Default Task
gulp.task('default', ['javascript', 'html', 'watch']);
