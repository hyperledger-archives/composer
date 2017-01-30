/*
 *	IBM Handlel - Sample application for the Concerto Blockchaing Solutions framework
 *
 *	(C) Copyright IBM Corp. 2016 All Rights Reserved.
 *
 *	US Government Users Restricted Rights - Use, duplication or
 *	disclosure restricted by GSA ADP Schedule Contract with
 *	IBM Corp.
 */

'use strict';

// grab our gulp packages
let gulp = require('gulp');
let file = require('gulp-file');
let gutil = require('gulp-util');

let zip = require('gulp-vinyl-zip');
let argv = require('yargs').alias('a','archiveFile').argv;


gulp.task('default', function () {
		gutil.log('Creating Business Network Definition Archive '+ argv.archiveFile);
		let p = require('./package.json');
		const path = require('path');

		gutil.log(Object.keys(p.dependencies)[0]);

		let networkpath = path.dirname(require.resolve(Object.keys(p.dependencies)[0]));

		let pnework = require(Object.keys(p.dependencies)[0] + '/package.json');
		let newPackageJSON = {
				'name': pnework.name,
				'description': pnework.description,
				'version': pnework.version
		};
	// console.log(newPackageJSON);
		let modelpath = path.dirname(require.resolve(Object.keys(pnework.dependencies)[0]));

		gutil.log('Load from this dir ' + networkpath);
		gutil.log('Load from this dir ' + modelpath);

		gulp.src([modelpath + '/**/*.cto', networkpath + '/**/lib/**/*.js']).
	pipe(file('package.json', JSON.stringify(newPackageJSON))).
	pipe(zip.dest(argv.archiveFile));
	// pipe(gulp.dest('dist'));



});
