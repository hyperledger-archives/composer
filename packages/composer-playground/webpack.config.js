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

'use strict';

// Look in ./config folder for webpack.dev.js
switch (process.env.NODE_ENV) {
case 'prod':
case 'production':
    module.exports = require('./config/webpack.prod')({env: 'production'});
    break;
case 'test':
case 'testing':
    module.exports = require('./config/webpack.test')({env: 'test'});
    break;
case 'dev':
case 'development':
default:
    module.exports = require('./config/webpack.dev')({env: 'development'});
}
