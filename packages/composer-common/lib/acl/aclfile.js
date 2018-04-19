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

const parser = require('./parser');
const AclRule = require('./aclrule');
const ParseException = require('../introspect/parseexception');

/**
 * Class representing an ACL File.
 * @private
 * @class
 * @memberof module:composer-common
 */
class AclFile {

    /**
     * Create an AclFile. This should only be called by framework code.
     * @param {string} id - The identifier of this ACL File (may be a filename for example)
     * @param {ModelManager} modelManager - the ModelManager that manages this
     * ModelFile and that will be used to validate the rules in the AclFile
     * @param {string} definitions - The ACL rules as a string.
     * @throws {IllegalAclException}
     */
    constructor(id, modelManager, definitions) {
        this.modelManager = modelManager;
        this.rules = [];
        this.identifier = id;

        if(!definitions || typeof definitions !== 'string') {
            throw new Error('AclFile expects an AclFile as a string as input.');
        }
        this.definitions = definitions;

        try {
            this.ast = parser.parse(definitions);
        }
        catch(err) {
            if(err.location && err.location.start) {
                throw new ParseException(err.message, err.location, id);
            }
            else {
                throw err;
            }
        }

        for(let n=0; n < this.ast.rules.length; n++ ) {
            let thing = this.ast.rules[n];
            const aclRule = new AclRule(this, thing);
            // TODO (DCS) check that the id of the AclRule does not already exist
            this.rules.push(aclRule);
        }
    }

    /**
     * Returns the name of this ACL File.
     * @return {string} the identifier of this ACL File
     */
    getIdentifier() {
        return this.identifier;
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
     * Returns the ModelManager associated with this AclFile
     *
     * @return {ModelManager} The ModelManager for this ModelFile
     */
    getModelManager() {
        return this.modelManager;
    }

    /**
     * Validates the ModelFile.
     *
     * @throws {IllegalAclException} if the model is invalid
     * @private
     */
    validate() {
        const aclRules = {};
        this.rules.forEach((aclRule) => {
            aclRule.validate();
            let name = aclRule.getName();
            if (aclRules[name]){
                throw new Error(`Found two or more ACL rules with the name '${name}'`);
            }
            aclRules[name] = aclRule;
        });
    }

    /**
     * Get all declarations in this ACL file
     * @return {AclRule[]} the AclRules defined in the ACL file
     */
    getAclRules() {
        return this.rules;
    }

    /**
     * Get the definitions for this ACL file.
     * @return {string} The definitions for this ACL file.
     */
    getDefinitions() {
        return this.definitions;
    }

}

module.exports = AclFile;
