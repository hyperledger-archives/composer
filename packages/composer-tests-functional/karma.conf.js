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

// Karma configuration
// Generated on Sat Nov 12 2016 22:36:17 GMT+0000 (GMT)

const processGlobal = require.resolve('browserfs/dist/shims/process.js');
const browserfsPath = require.resolve('browserfs');

module.exports = function(config) {
    config.set({

        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '',


        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['mocha', 'browserify'],


        // list of files / patterns to load in the browser
        files: [
            'systest/**/*.js'
        ],


        // list of files to exclude
        exclude: [],


        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {
            'systest/**/*.js': ['browserify']
        },


        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ['spec'],


        // web server port
        port: 9876,


        // enable / disable colors in the output (reporters and logs)
        colors: true,


        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_DEBUG,


        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,


        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: ['Chrome'],


        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: false,

        // Concurrency level    // how many browser should be started simultaneous
        concurrency: Infinity,

        browserify: {
            debug: true,
            transform: ['brfs'],
            builtins: Object.assign({}, require('browserify/lib/builtins'), {
                buffer: require.resolve('browserfs/dist/shims/buffer.js'),
                fs: require.resolve('browserfs/dist/shims/fs.js'),
                path: require.resolve('browserfs/dist/shims/path.js'),
            }),
            insertGlobalVars: {
                // process, Buffer, and BrowserFS globals.
                // BrowserFS global is not required if you include browserfs.js
                // in a script tag.
                process: function () { return 'require(\''+processGlobal+'\')'; },
                Buffer: function () { return 'require(\'buffer\').Buffer'; },
                BrowserFS: function () { return 'require(\'' + browserfsPath + '\')'; }
            }
        },

        client: {
            captureConsole: !!process.env.DEBUG,
            mocha: {
                timeout: '0'
            }
        },

        specReporter: {
            maxLogLines: 5, // limit number of lines logged per test
            suppressErrorSummary: true, // do not print error summary
            suppressFailed: false, // do not print information about failed tests
            suppressPassed: false, // do not print information about passed tests
            suppressSkipped: true, // do not print information about skipped tests
            showSpecTiming: false // print the time elapsed for each spec
        }
    });
};
