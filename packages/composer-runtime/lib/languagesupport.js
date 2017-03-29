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

/**
 * A class for language support
 * @public
 */
class LanguageSupport {

    /**
     * Create a LanguageSupport.
     * @param {String} language The language.
     * @param {String} description The description.
     * @param {ScriptProcessor} scriptProcessor The scriptProcessor.
     * @param {TransactionExecutor} transactionExecutor The transactionExecutor.
     * @param {Object} codemirror The codemirror style.
     */
    constructor(language, description, scriptProcessor, transactionExecutor, codemirror){
        this.language = language;
        this.description = description;
        this.scriptProcessor = scriptProcessor;
        this.transactionExecutor = transactionExecutor;
        this.codemirror = codemirror;
    }

    /**
     * Get the language.
     *
     * @returns {String} The language
     */
    getLanguage() {
        return this.language;
    }

    /**
     * Get code mirror style.
     * @returns {Object} The code mirror style
     */
    getCodeMirrorStyle() {
        return this.codemirror;
    }

    /**
     * Get the script processor.
     * @returns {ScriptProcessor} The script processor
     */
    getScriptProcessor() {
        return this.scriptProcessor;
    }

    /**
     * Get the transaction executor.
     * @returns {TransactionExecutor} The transaction executor
     */
    getTransactionExecutor() {
        return this.transactionExecutor;
    }

    /**
     * Stop serialization of this object.
     * @return {Object} An empty object.
     */
    toJSON() {
        return {};
    }

}

/**
 * A builder class for language support
 * @public
 */
class Builder {
    /**
     * Create a LanguageSupport builder.
     * @param {String} language The language.
     */
    constructor(language){
        this._language = language;
    }

    /**
     * Set the description.
     * @param {String} description The description.
     * @returns {LanguageSupport.Builder} Return this for chaining.
     */
    description(description){
        this._description = description;
        return this;
    }

    /**
     * Set the scriptProcessor.
     * @param {ScriptProcessor} scriptProcessor The scriptProcessor.
     * @returns {LanguageSupport.Builder} Return this for chaining.
     */
    scriptProcessor(scriptProcessor){
        this._scriptProcessor = scriptProcessor;
        return this;
    }

    /**
     * Set the transactionExecutor.
     * @param {TransactionExecutor} transactionExecutor The transactionExecutor.
     * @returns {LanguageSupport.Builder} Return this for chaining.
     */
    transactionExecutor(transactionExecutor){
        this._transactionExecutor = transactionExecutor;
        return this;
    }

    /**
     * Set the codemirror
     * @param {Object} codemirror The codemirror style.
     * @returns {LanguageSupport.Builder} Return this for chaining.
     */
    codemirror(codemirror){
        this._codemirror = codemirror;
        return this;
    }

    /**
     * Build the LanguageSupport object
     * @returns {LanguageSupport} The LanguageSupport to be created
     */
    build(){
        if(!this._language){
            throw new Error('Must specify language');
        }
        return new LanguageSupport(this._language, this._description, this._scriptProcessor, this._transactionExecutor, this._codemirror);
    }
}

LanguageSupport.Builder = Builder;

module.exports = LanguageSupport;
