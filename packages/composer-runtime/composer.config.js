/*
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const JSScriptProcessor = require('composer-common').JSScriptProcessor;
const JSTransactionExecutor = require('./lib/jstransactionexecutor');
        
module.exports = function (options) {
    let languages = {
            'JS' : {
                'description' : 'Built-in JS language support',
                'scriptprocessor' : new JSScriptProcessor(),
                'transactionexecutor' : new JSTransactionExecutor(),
                'codemirror' : {
                    lineNumbers: true,
                    lineWrapping: true,
                    readOnly: false,
                    mode: 'javascript',
                    autofocus: true,
                    extraKeys: { 'Ctrl-Q': function(cm) { cm.foldCode(cm.getCursor()); } },
                    foldGutter: true,
                    gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
                    scrollbarStyle: 'simple'
                },
            },
    };
    return {
        languages: languages
    }
};
