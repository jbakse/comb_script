'use strict';

// Include Gulp
var gulp = require('gulp');

var rename = require('gulp-rename');
var plumber = require('gulp-plumber');
var livereload = require('gulp-livereload');
var less = require('gulp-less');
var yaml = require('gulp-yml');
var concat = require('gulp-concat');
var insert = require('gulp-insert');
var browserify = require('gulp-browserify');
var jade = require('gulp-jade');
var build = require('gulp-build');


var comb_package = require('./package.json');


gulp.task('javascript', function() {
	return gulp
		.src(['./src/javascript/main.js', './src/javascript/docs.js'], {
			read: false
		})
		.pipe(plumber())
		.pipe(browserify({
			transform: ['brfs', 'deglobalify'],
			debug: true
		}))
		.pipe(gulp.dest('./build/javascript/'))
		
		.pipe(livereload())
		;
});

gulp.task('jade', function() {
	return gulp.src(['./src/docs.jade']) //, './src/style/main.less'
		.pipe(plumber())
		.pipe(jade())
		.pipe(gulp.dest('./build/'))
		.pipe(livereload())
		;
});


gulp.task('less', function() {
	return gulp.src(['./src/style/docs.less', './src/style/main.less']) //, './src/style/main.less'
		.pipe(plumber())
		.pipe(less())
		.pipe(gulp.dest('./build/css/'))
		.pipe(livereload())
		;
});


gulp.task('html', function() {
	return gulp.src('./src/**/*.html')
		.pipe(build(comb_package))
		.pipe(gulp.dest('./build/'))
		.pipe(livereload())
		;
});


gulp.task('lib', function() {
	return gulp.src('./lib/**')
		.pipe(gulp.dest('./build/lib/'))
		.pipe(livereload())
		;
});

gulp.task('test_lib', function() {
	return gulp.src('./test_lib/**')
		.pipe(gulp.dest('./build/test_lib/'))
		.pipe(livereload())
		;
});


gulp.task('images', function() {
	return gulp.src('./src/images/**/*.*')
		.pipe(gulp.dest('./build/images/'))
		.pipe(livereload())
		;
});

gulp.task('examples', function() {
	return gulp.src('./src/examples/**/*.*')
		.pipe(gulp.dest('./build/examples/'))
		.pipe(livereload())
		;
});



gulp.task('language', function() {
	return gulp.src('./src/language/region_types/*.yaml')
		.pipe(plumber())
		.pipe(concat('language.yaml'))
		.pipe(yaml())
		.pipe(insert.prepend('regionTypes = '))
		.pipe(rename("language.js"))
		.pipe(gulp.dest('./build/javascript/'))
		.pipe(livereload())
		;

});



//Watch Files For Changes
gulp.task('watch', function() {

	gulp.watch('./src/javascript/**/*.js', ['javascript']);
	gulp.watch('./src/style/*.less', ['less']);
	gulp.watch('./src/language/**/*.yaml', ['language']);
	gulp.watch('./src/**/*.html', ['html']);
	gulp.watch('./src/**/*.jade', ['jade']);
	gulp.watch('./src/examples/**', ['examples']);

	gulp.watch('yaml/*.*').on('change', function(file) {
		livereload().changed(file.path);
	});


	// livereload.listen();
	// gulp.watch('build/**').on('change', livereload.changed);

});



// Default Task
gulp.task('default', ['javascript', 'less', 'language', 'lib', 'test_lib', 'html', 'jade', 'images', 'examples', 'watch']);

