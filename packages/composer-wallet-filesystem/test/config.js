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
const util=require('util');
const rimraf = util.promisify(require('rimraf'));
const mkdirp = require('mkdirp');
const os = require('os');
const path= require('path');

module.exports.getStore = require('../index.js').getStore;
module.exports.wrongConfigs = [
    { c: null, text: 'Cannot read property' },
    { c: { storePath : {} }, text: 'Path must be a string' },
    { c: { storePath : '/nothere'  }, text: 'permission denied'}
];
module.exports.correctConfigs=[
    { c: {}, text: 'Default Locations' },
    { c: { storePath : '/tmp/filestemwallet'  }, text: 'custom location'}
];
module.exports.clean=async ()=>{
    await rimraf('/tmp/filestemwallet');
    mkdirp.sync('/tmp/filestemwallet');
    await rimraf(path.resolve(os.homedir(),'.composer'));
};

module.exports.messages={
    GET_NON_EXISTANT:/no such file or directory/,
    GET_INVALID_NAME:/Name must be specified/
};
