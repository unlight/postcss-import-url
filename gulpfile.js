var gulp = require('gulp');
var connect = require('gulp-connect');
var mocha = require('gulp-mocha');
var eslint = require('gulp-eslint');

var files = ['index.js', 'gulpfile.js'];

gulp.task('lint', function () {
    return gulp.src(files).pipe(eslint()).pipe(eslint.format());
    // .pipe(eslint.failAfterError());
});

gulp.task('test', function () {
    var startServer = gulp.task('start-server');
    startServer();
    return gulp
        .src('test/*.js', { read: false })
        .pipe(mocha({ timeout: 5000 }))
        .on('end', connect.serverClose);
});

gulp.task('test:w', function () {
    var startServer = gulp.task('start-server');
    startServer();
    return gulp
        .src('test/*.js', { read: false })
        .pipe(mocha({ timeout: 5000, watch: true }))
        .on('end', connect.serverClose);
});

gulp.task('default', gulp.series(['lint', 'test']));

gulp.task('watch', function () {
    gulp.watch(files, gulp.series(['lint', 'test']));
});

gulp.task('start-server', function () {
    connect.server({
        root: './test',
        port: 1234,
    });
});

gulp.task('close-server', function () {
    connect.serverClose();
});
