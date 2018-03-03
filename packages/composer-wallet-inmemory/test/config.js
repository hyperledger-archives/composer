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

module.exports.getStore = require('../index.js').getStore;
module.exports.wrongConfigs = [

];
module.exports.correctConfigs=[
    { c: null, text: 'ok with null config' },
    { c: {}, text: 'ok' }
];
module.exports.clean=async ()=>{

};

module.exports.messages={
    GET_NON_EXISTANT:/No such entry/,
    GET_INVALID_NAME:/Name must be specified/
};