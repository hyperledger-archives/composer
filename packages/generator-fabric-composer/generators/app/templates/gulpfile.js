/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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
