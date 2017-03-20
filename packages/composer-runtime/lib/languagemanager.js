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

const composerConfig = require('../composer.config');
const ScriptManager = require('composer-common').ScriptManager;

/**
 * A class for managing languages registered in the config file
 * @public
 */
class LanguageManager {

    constructor(){
        let config = composerConfig({});
        this.languages = config.languages? config.languages : [];
        
        // Add the script processors to the script manager
        this.getScriptProcessors().forEach(function(scriptprocessor){
            if(scriptprocessor) {
                ScriptManager.addScriptProcessor(scriptprocessor);
            }
        });
    }

    /**
     * Get all the languages.
     */
    getLanguages() {
        return Object.getOwnPropertyNames(this.languages);
    }

    /**
     * Get all the script code mirror style by language.
     * @param language The language to be specified. 
     */
    getCodeMirrorStyle(language) {
        return this.languages[language].codemirror;
    }

   
    /**
     * Get all the script processors.
     */
    getScriptProcessors() {
        let _languages = this.languages;
        return this.getLanguages().map((language) => _languages[language].scriptprocessor);
    }

    /**
     * Get all the transaction executors.
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
