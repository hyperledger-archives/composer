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

const Script = require('./introspect/script');

/**
 * <p>
 * Manages a set of scripts.
 * </p>
 * @private
 * @class
 * @memberof module:composer-common
 */
class ScriptManager {

  /**
   * Create the ScriptManager.
   * <p>
   * <strong>Note: Only to be called by framework code. Applications should
   * retrieve instances from {@link BusinessNetworkDefinition}</strong>
   * </p>
   * @param {ModelManager} modelManager - The ModelManager to use for this ScriptManager
   */
    constructor(modelManager) {
        this.modelManager = modelManager;
        this.scripts = {};
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
     * Creates a new Script from a string.
     *
     * @param {string} identifier - the identifier of the script
     * @param {string} language - the language identifier of the script
     * @param {string} contents - the contents of the script
     * @returns {Script} - the instantiated script
     */
    createScript(identifier, language, contents) {
        return new Script(this.modelManager, identifier, language, contents );
    }

    /**
     * Adds a Script to the ScriptManager
     * @param {Script} script - The script to add to the ScriptManager
     */
    addScript(script) {
        this.scripts[script.getIdentifier()] = script;
    }

    /**
     * Update an existing Script in the ScriptManager
     * @param {Script} script - The script to add to the ScriptManager
     */
    updateScript(script) {
        if (!this.scripts[script.getIdentifier()]) {
            throw new Error('Script file does not exist');
        }
        this.addScript(script);
    }

    /**
     * Remove the Script
     * @param {string} identifier - The identifier of the script to remove
     * delete.
     */
    deleteScript(identifier) {
        if (!this.scripts[identifier]) {
            throw new Error('Script file does not exist');
        }
        delete this.scripts[identifier];
    }

    /**
     * Get the array of Script instances
     * @return {Script[]} The Scripts registered
     * @private
     */
    getScripts() {
        let keys = Object.keys(this.scripts);
        let result = [];

        for(let n=0; n < keys.length;n++) {
            result.push(this.scripts[keys[n]]);
        }

        return result;
    }

    /**
     * Remove all registered Composer files
     */
    clearScripts() {
        this.scripts = {};
    }

    /**
     * Get the Script associated with an identifier
     * @param {string} identifier - the identifier of the Script
     * @return {Script} the Script
     * @private
     */
    getScript(identifier) {
        return this.scripts[identifier];
    }

    /**
     * Get the identifiers of all registered scripts
     * @return {string[]} The identifiers of all registered scripts
     */
    getScriptIdentifiers() {
        return Object.keys(this.scripts);
    }

}

module.exports = ScriptManager;
