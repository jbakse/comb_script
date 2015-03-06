'use strict';

var gulp = require('gulp');

var gutil = require('gulp-util');
var sourcemaps = require('gulp-sourcemaps');
var rename = require('gulp-rename');
var insert = require('gulp-insert');
var concat = require('gulp-concat');
var build = require('gulp-build');
var plumber = require('gulp-plumber');
var livereload = require('gulp-livereload');

var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');

var watchify = require('watchify');
var browserify = require('browserify');

var less = require('gulp-less');
var yaml = require('gulp-yml');
var jade = require('gulp-jade');

var comb_package = require('./package.json');




var args = watchify.args;
args.paths = ['new_lib'];
var bundler = watchify(browserify('./src/javascript/main.js', args));
bundler.transform('brfs');
// bundler.transform('deglobalify');
bundler.on('update', bundle); // on any dep update, runs the bundler
bundler.on('log', gutil.log); // output build logs to terminal

function bundle() {
  return bundler.bundle()
    // log errors if they happen
    // .on('error', gutil.log.bind(gutil, 'Browserify Error'))

    .on('error', function(e) { 
	gutil.log(gutil.colors.red("Browserify Error\n"), "Line:", e.loc && e.loc.line, "\n", "File:", e.filename, "\n", e);
    })
    .pipe(source('bundle.js'))
    // optional, remove if you dont want sourcemaps
      .pipe(buffer())
      .pipe(sourcemaps.init({loadMaps: true})) // loads map from browserify file
      .pipe(sourcemaps.write()) // writes .map file
    //
    .pipe(rename({basename: "main"}))
    .pipe(gulp.dest('./build/javascript/'))
    .pipe(livereload());
}

gulp.task('browserify', bundle); // so you can run `gulp js` to build the file





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
	return gulp.src('./new_lib/**')
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

	// gulp.watch('./src/javascript/**/*.js', ['javascript']);
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
gulp.task('default', ['browserify', 'less', 'language', 'lib', 'test_lib', 'html', 'jade', 'images', 'examples', 'watch']);




// var browserify = require('gulp-browserify');
// gulp.task('javascript', function() {
// 	return gulp
// 		.src(['./src/javascript/main.js', './src/javascript/docs.js'], {
// 			read: false
// 		})
// 		.pipe(plumber())
// 		.pipe(browserify({
// 			transform: ['brfs', 'deglobalify'],
// 			debug: true
// 		}))
// 		.pipe(gulp.dest('./build/javascript/'))

// 		.pipe(livereload())
// 		;
// });
