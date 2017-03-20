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

/**
 * A class for processing script files.
 * @protected
 */
class ScriptProcessor {

    /**
     * Get the type of this script processor.
     * @abstract
     * @return {string} The type of this transaction executor.
     */
    getType() {
        throw new Error('abstract function called');
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
        throw new Error('abstract function called');
    }

    /**
     * Process the specified script file.
     * @abstract
     * @return {string} The content of new script file.
     */
    newContent(){
        throw new Error('abstract function called');
    }
}

module.exports = ScriptProcessor;
