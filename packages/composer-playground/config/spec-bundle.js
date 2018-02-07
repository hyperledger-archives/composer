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
/**
 * @author: @AngularClass
 */

/*
 * When testing with webpack and ES6, we have to do some extra
 * things to get testing to work right. Because we are gonna write tests
 * in ES6 too, we have to compile those as well. That's handled in
 * karma.conf.js with the karma-webpack plugin. This is the entry
 * file for webpack test. Just like webpack will create a bundle.js
 * file for our client, when we run test, it will compile and bundle them
 * all here! Crazy huh. So we need to do some setup
 */

/* eslint-disable require-jsdoc */
/* eslint-disable no-unused-vars */

'use strict';

Error.stackTraceLimit = Infinity;

require('core-js/es6');
require('core-js/es7/reflect');

// Typescript emit helpers polyfill
require('ts-helpers');

require('zone.js/dist/zone');
require('zone.js/dist/long-stack-trace-zone');
require('zone.js/dist/proxy'); // since zone.js 0.6.15
require('zone.js/dist/sync-test');
require('zone.js/dist/jasmine-patch'); // put here since zone.js 0.6.14
require('zone.js/dist/async-test');
require('zone.js/dist/fake-async-test');

// RxJS
require('rxjs/Rx');

let testing = require('@angular/core/testing');
let browser = require('@angular/platform-browser-dynamic/testing');

testing.TestBed.initTestEnvironment(
    browser.BrowserDynamicTestingModule,
    browser.platformBrowserDynamicTesting()
);

/*
 * Ok, this is kinda crazy. We can use the context method on
 * require that webpack created in order to tell webpack
 * what files we actually want to require or import.
 * Below, context will be a function/object with file names as keys.
 * Using that regex we are saying look in ../src then find
 * any file that ends with spec.ts and get its path. By passing in true
 * we say do this recursively
 */
let testContext = require.context('../src', true, /\.spec\.ts/);

/*
 * get all the files, for each file, call the context function
 * that will require the file and load it up here. Context will
 * loop and require those spec files here
 */
function requireAll(requireContext) {
    return requireContext.keys().map(requireContext);
}

// requires and returns all modules that match
let modules = requireAll(testContext);
