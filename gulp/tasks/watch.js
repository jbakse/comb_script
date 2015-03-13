/* Notes:
   - gulp/tasks/browserify.js handles js recompiling with watchify
   - gulp/tasks/browserSync.js watches and reloads compiled files
*/

var gulp     = require('gulp');
var config   = require('../config');

gulp.task('watch', ['watchify','browserSync'], function(callback) {
  gulp.watch(config.images.src, ['images']);
  gulp.watch(config.markup.src, ['markup']);
  gulp.watch(config.less.src, ['less']);
  gulp.watch(config.sass.src, ['sass']);
  gulp.watch(config.jade.watch, ['jade']);

  gulp.watch('./src/language/**/*.yaml', ['language']);
  // Watchify will watch and recompile our JS, so no need to gulp.watch it
});
