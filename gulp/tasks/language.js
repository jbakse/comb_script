var gulp         = require('gulp');
var browserSync  = require('browser-sync');

var plumber	= require('gulp-plumber');
var yaml	= require('gulp-yml');
var insert	= require('gulp-insert');
var rename	= require('gulp-rename');
var concat	= require('gulp-concat');

gulp.task('language', function() {
	return gulp.src('./src/language/region_types/*.yaml')
		.pipe(plumber())
		.pipe(concat('language.yaml'))
		.pipe(yaml())
		.pipe(insert.prepend('regionTypes = '))
		.pipe(rename("language.js"))
		.pipe(gulp.dest('./build/javascript/'))
		.pipe(browserSync.reload({stream:true}))
		;

});
