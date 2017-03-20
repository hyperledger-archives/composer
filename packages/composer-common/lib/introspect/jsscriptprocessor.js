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

const JavaScriptParser = require('../codegen/javascriptparser');
const ScriptProcessor = require('./scriptprocessor');
const FunctionDeclaration = require('../introspect/functiondeclaration');

/**
 * A class for executing JavaScript transaction processor functions.
 * @protected
 */
class JSScriptProcessor extends ScriptProcessor {

    /**
     * Get the type of this transaction executor.
     * @return {string} The type of this transaction executor.
     */
    getType() {
        return 'JS';
    }

    /**
     * Process the specified script file.
     * @abstract
     * @param {ModelManager} modelManager - The ModelManager associated with this Script
     * @param {string} identifier - The identifier of the script
     * @param {string} contents - The contents of the script
     * @return {FunctionDeclaration[]} A promise that is resolved when the transaction has been
     * executed, or rejected with an error.
     */
    process(modelManager, identifier, contents) {
        const parser = new JavaScriptParser(contents);
        var results = [];
        const functions = parser.getFunctions();
        for(let n=0; n < functions.length; n++) {
            const func = functions[n];
            const functionDeclaration = new FunctionDeclaration(modelManager, "JS", func.name, func.visibility,
              func.returnType, func.throws, func.parameterNames, func.parameterTypes, func.decorators, func.functionText );
            functionDeclaration.validate();
            results.push( functionDeclaration );
        }
        return results;
    }

    /**
     * Process the specified script file.
     * @abstract
     * @return {string} The content of new script file.
     */
    newContent(){
        let content =
`/**
 * New script file
 */`; 
        return content; 
    }


}

module.exports = JSScriptProcessor;
