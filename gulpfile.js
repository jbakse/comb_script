// Include Gulp
var gulp = require('gulp'); 

// Include Plugins
// var plumber = require('gulp-plumber');
var watch = require('gulp-watch');
var rename = require('gulp-rename');
var plumber = require('gulp-plumber');
var livereload = require('gulp-livereload');
var browserify = require('gulp-browserify');
var less = require('gulp-less');

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


gulp.task('javascript-doc', function() {
	return gulp
		.src('./src/javascript/doc.js', {read: false})
		.pipe(plumber())
		.pipe( browserify({debug: true}))
		.pipe(rename('doc.js'))
		.pipe(gulp.dest('./build/javascript/'))
		.pipe(livereload())
		;
});

gulp.task('style', function() {
	return gulp.src('./src/style/main.less')
		.pipe(plumber())
		.pipe(less())
		.pipe(gulp.dest('./build/css/'))
		.pipe(livereload())
		;
});

gulp.task('styledocs', function() {
	return gulp.src('./src/style/doc.less')
		.pipe(plumber())
		.pipe(less())
		.pipe(gulp.dest('./build/css/'))
		.pipe(livereload())
		;
});

gulp.task('html', function() {
	return gulp.src('./src/*.html')
		.pipe(gulp.dest('./build/'))
		.pipe(livereload())
		;
});


gulp.task('images', function() {
	return gulp.src('./src/images/**/*.*')
		.pipe(gulp.dest('./build/images/'))
		.pipe(livereload())
		;
});


var yaml    = require('gulp-yml');
var concat = require('gulp-concat');
var insert = require('gulp-insert');
var rename = require("gulp-rename")

gulp.task('language', function() {
	console.log("try yamling");
	return gulp.src('./src/language/*.yaml')
		.pipe(plumber())
		.pipe(concat('language.yaml'))
		.pipe( yaml() )
		.pipe( insert.prepend('language = '))
		.pipe(rename("language.js"))
		.pipe(gulp.dest('./build/javascript/'))
		.pipe(livereload())
		;

});



//Watch Files For Changes
gulp.task('watch', function() {

	gulp.watch('./src/javascript/**/*.js', ['javascript']);
	// gulp.watch('./src/javascript/**/*.js', ['javascript-doc']);
	gulp.watch('./src/language/*.yaml', ['language']);
	gulp.watch('./src/style/*.less', ['style', 'styledocs']);
	gulp.watch('./src/*.html', ['html']);
	gulp.watch('yaml/*.*').on('change', function(file) {livereload().changed(file.path);});

});



// Default Task
gulp.task('default', ['javascript', 'javascript-doc', 'language', 'style', 'styledocs', 'html', 'images', 'watch']);

