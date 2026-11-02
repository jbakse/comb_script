/*
  build-legacy.js
  ===============
  Builds ./build with the 2015 gulp tasks, without the gulp CLI.
  See BUILDING.md for why this exists and how to run it.

  - Skips gulp/tasks/sass.js: node-sass 2.x can't be installed on
    modern systems. Compile the CSS separately (BUILDING.md).
  - Runs the language task's pipeline directly: through gulp-plumber
    and browserSync.reload it stalls on Node 10 and writes nothing.
  - Requires task files directly instead of using require-dir 0.1.0,
    which crashes on Node 10.
*/

var path = require('path');
var root = path.join(__dirname, '..');
process.chdir(root);

var gulp = require('gulp');
var yaml = require('gulp-yml');
var insert = require('gulp-insert');
var rename = require('gulp-rename');
var concat = require('gulp-concat');

var tasks = ['lib', 'images', 'markup', 'jade', 'browserify'];
tasks.forEach(function(t) {
	require(path.join(root, 'gulp/tasks', t + '.js'));
});

// same as gulp/tasks/language.js, minus plumber and browserSync
gulp.task('language-legacy', function() {
	return gulp.src('./src/language/region_types/*.yaml')
		.pipe(concat('language.yaml'))
		.pipe(yaml())
		.pipe(insert.prepend('regionTypes = '))
		.pipe(rename('language.js'))
		.pipe(gulp.dest('./build/javascript/'))
		.on('data', function() {})
		;
});

gulp.on('task_err', function(e) {
	console.error('task failed:', e.task, e.message);
});

gulp.start(tasks.concat('language-legacy'), function(err) {
	console.log(err ? 'build failed' : 'build done');
	process.exit(err ? 1 : 0);
});
