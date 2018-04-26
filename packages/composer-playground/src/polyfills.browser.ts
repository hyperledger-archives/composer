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
// TODO(gdi2290): switch to DLLs

// Polyfills

import 'babel-polyfill';

// import 'ie-shim'; // Internet Explorer 9 support

// import 'core-js/es6';
// Added parts of es6 which are necessary for your project or your browser support requirements.
import 'core-js/es6/symbol';
import 'core-js/es6/object';
import 'core-js/es6/function';
import 'core-js/es6/parse-int';
import 'core-js/es6/parse-float';
import 'core-js/es6/number';
import 'core-js/es6/math';
import 'core-js/es6/string';
import 'core-js/es6/date';
import 'core-js/es6/array';
import 'core-js/es6/regexp';
import 'core-js/es6/map';
import 'core-js/es6/set';
import 'core-js/es6/weak-map';
import 'core-js/es6/weak-set';
import 'core-js/es6/typed';
import 'core-js/es6/reflect';
// see issue https://github.com/AngularClass/angular2-webpack-starter/issues/709
// import 'core-js/es6/promise';

import 'core-js/es7/reflect';
import 'zone.js/dist/zone';

import 'web-animations-js';

// Typescript emit helpers polyfill
import 'ts-helpers';

if ('production' === ENV) {
    // Production

} else {
    // Development

    Error.stackTraceLimit = Infinity;

    // tslint:disable-next-line:no-var-requires
    require('zone.js/dist/long-stack-trace-zone');

}
