'use strict';

let del = require('del');
let gulp = require('gulp');
let sourcemaps = require('gulp-sourcemaps');
let typescript = require('gulp-typescript');
let path = require('path');

gulp.task('default', ['dev']);

gulp.task('clean', function() 
{
    return del('dist');
});

let project = typescript.createProject('tsconfig.json');

gulp.task('prod', ['clean'], () =>
{
    return project.src()
        .pipe(project(typescript.reporter.defaultReporter()))
        .on('error', () =>
        {
            this.on('finish', () =>
            {
                process.exit(1);
            });
        })
        .js
        .pipe(gulp.dest('dist'))
});

gulp.task('dev', ['clean'], () =>
{
    const writeSourceMapsOptions = 
    {
        sourceRoot: (file) => 
        {
            return path.join(path.relative(path.join('dist', path.dirname(file.relative)), '.'), 'src');
        },
    };

    return project.src()
        .pipe(sourcemaps.init())
        .pipe(project(typescript.reporter.defaultReporter()))
        .on('error', () =>
        {
            this.on('finish', () =>
            {
                process.exit(1);
            });
        })
        .js
        .pipe(sourcemaps.write(writeSourceMapsOptions))
        .pipe(gulp.dest('dist'))
});