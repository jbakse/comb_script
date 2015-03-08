var gulp = require('gulp');
var browserSync  = require('browser-sync');

gulp.task('lib', function() {
	return gulp.src('./new_lib/**')
		.pipe(gulp.dest('./build/lib/'))
		.pipe(browserSync.reload({stream:true}))
		;
});
