/*global __dirname,process*/
var browserify = require('browserify');
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var gutil = require('gulp-util');
var del = require('del');
var fs = require('fs');
var _ = require('lodash');
var hasOwn = {}.hasOwnProperty;

var scriptSrcFiles = 'src/**/*.js';
var destJsFile = 'uimclient.js';
var entries = ['./src/main.js'];
var distDir = './dist/';
var distDemoDir = './demo/public/javascripts/';
var distFiles = [
  distDir + '/' + destJsFile,
  distDir + '/' + destJsFile + '.map'
];
var releaseObjectName = 'uimclient';
var replaceLibsPattern = '<<REPLACE-EXTRAS>>';

var parseArgs = require('minimist');
var cmdOptions = parseArgs(process.argv.slice(2), {
  string: ['name', 'ui']
});

gulp.task('default', ['build']);

gulp.task('build', ['clean'], function() {
  if (hasOwn.call(cmdOptions, 'name') && cmdOptions.name.length > 0) {
    releaseObjectName = cmdOptions.name;
  }

  var b = browserify({
    entries: entries,
    standalone: releaseObjectName,
    debug: true
  });

  return b.bundle()
    .pipe(source(destJsFile))
    .pipe(buffer())
    .pipe(sourcemaps.init({
      loadMaps: true
    }))
    .pipe(uglify({
      mangle: {
        reserved: ['UIMClientSDK']
      },
      output: {
        quote_style: 3,
        max_line_len: 32000
      }
    }))
    .on('error', gutil.log)
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(distDir))
    .pipe(gulp.dest(distDemoDir));
});

gulp.task('clean', function() {
  var paths = del.sync(distFiles);
  console.log('Deleted files and folders:\n' + paths.join('\n'));
});

gulp.task('test', [], function() {
  var test = require('./test/test.js');
  test.run();
});

gulp.task('watch', ['build'], function() {
  var watcher = gulp.watch(scriptSrcFiles, ['build']);
  watcher.on('change', function(event) {
    console.log('File ' + event.path + ' was ' +
      event.type + ', running tasks...');
  });
});