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

const FunctionDeclaration = require('../introspect/functiondeclaration');
const JavaScriptParser = require('../codegen/javascriptparser');

const Logger = require('../log/logger');
const LOG = Logger.getLog('Script');

/**
 * <p>
 * An executable script.
 * </p>
 * @private
 * @class
 * @memberof module:composer-common
 */
class Script {

  /**
   * Create the Script.
   * <p>
   * @param {ModelManager} modelManager - The ModelManager associated with this Script
   * @param {string} identifier - The identifier of the script
   * @param {string} language - The language type of the script
   * @param {string} contents - The contents of the script
   */
    constructor(modelManager, identifier, language, contents) {
        this.modelManager = modelManager;
        this.identifier = identifier;
        this.language = language;
        this.contents = contents;
        this.functions = [];

        if(!contents) {
            throw new Error('Empty script contents');
        }
        let data = {errorStatement:''};
        let parser;
        try {
            parser = new JavaScriptParser(this.contents, false, 8);
        } catch (cause) {
            // consider adding a toHex method in the exception to put out the pure hex values of the file.
            const error = new SyntaxError('Failed to parse ' + this.identifier + ': ' + cause.message+'\n'+data.errorStatement);
            error.cause = cause;
            LOG.error('constructor', error.message, contents);
            throw error;
        }

        const functions = parser.getFunctions();

        for(let n=0; n < functions.length; n++) {
            const func = functions[n];
            const functionDeclaration = new FunctionDeclaration(this.modelManager, this.language, func.name, func.visibility,
              func.returnType, func.throws, func.parameterNames, func.parameterTypes, func.decorators, func.functionText );
            functionDeclaration.validate();
            this.functions.push( functionDeclaration );
        }

        this.tokens = parser.getTokens();
    }

    /**
     * Visitor design pattern
     * @param {Object} visitor - the visitor
     * @param {Object} parameters  - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    accept(visitor,parameters) {
        return visitor.visit(this, parameters);
    }

    /**
     * Returns the identifier of the script
     * @return {string} the identifier of the script
     */
    getIdentifier() {
        return this.identifier;
    }

    /**
     * Returns the identifier of the script
     * @return {string} the identifier of the script
     */
    getName() {
        return this.identifier;
    }

    /**
     * Returns the language of the script
     * @return {string} the identifier of the script
     */
    getLanguage() {
        return this.language;
    }

    /**
     * Returns the contents of the script
     * @return {string} the identifier of the script
     */
    getContents() {
        return this.contents;
    }

    /**
     * Returns the FunctionDeclaration for all functions that have been defined in this
     * Script.
     *
     * @return {FunctionDeclaration[]} The array of FunctionDeclarations
     */
    getFunctionDeclarations() {
        return this.functions;
    }

    /**
     * Returns the tokens of the script
     * @return {Object[]} the tokens of the script
     */
    getTokens() {
        return this.tokens;
    }

}

module.exports = Script;
