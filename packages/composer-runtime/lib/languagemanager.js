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

const ScriptManager = require('composer-common').ScriptManager;
const JSScriptProcessor = require('composer-common').JSScriptProcessor;
const JSTransactionExecutor = require('./jstransactionexecutor');

let _languages = {
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

/**
 * A class for managing languages registered in the config file
 * @public
 */
class LanguageManager {

    /**
     * Create a LanguageManager.
     *
     */
    constructor(){
        this.languages = _languages;

        // Add the script processors to the script manager
        this.getScriptProcessors().forEach(function(scriptprocessor){
            if(scriptprocessor) {
                ScriptManager.addScriptProcessor(scriptprocessor);
            }
        });
    }

    /**
     * Get all the languages.
     *
     * @returns {String[]} All the languages
     */
    getLanguages() {
        return Object.getOwnPropertyNames(this.languages);
    }

    /**
     * Get all the script code mirror style by language.
     * @param {String} language The language to be specified.
     * @returns {Object} The code mirror style
     */
    getCodeMirrorStyle(language) {
        return this.languages[language].codemirror;
    }

    /**
     * Get all the script processors.
     * @returns {ScriptProcessor[]} The script processors
     */
    getScriptProcessors() {
        let _languages = this.languages;
        return this.getLanguages().map((language) => _languages[language].scriptprocessor);
    }

    /**
     * Get all the transaction executors.
     * @returns {TransactionExecutor[]} The transaction executors
     */
    getTransactionExecutors() {
        let _languages = this.languages;
        return this.getLanguages().map((language) => _languages[language].transactionexecutor);
    }

    /**
     * Stop serialization of this object.
     * @return {Object} An empty object.
     */
    toJSON() {
        return {};
    }

}

const _languageManager = new LanguageManager();

module.exports = _languageManager;
