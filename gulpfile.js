const gulp = require('gulp');
const babel = require('gulp-babel');
const path=require("path");
console.log(__dirname);
gulp.task("build",() => {
    return gulp.src(path.join(__dirname,'/**/*.es6'))
      .pipe(babel({
        presets: ['es2015']
      }))
      .pipe(gulp.dest(__dirname));
  });

gulp.task("watch",() => {
  gulp.watch(path.join(__dirname,"./**/*.es6"),["build"]);
});



gulp.task('default',["watch"]);
