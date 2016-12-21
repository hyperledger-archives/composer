/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Concerto - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
 */

'use strict';

const parser = require('./parser');
const AclRule = require('./aclrule');
const ParseException = require('../introspect/parseexception');

/**
 * Class representing an ACL File.
 * @private
 * @class
 * @memberof module:ibm-concerto-common
 */
class AclFile {

    /**
     * Create an AclFile. This should only be called by framework code.
     *
     * @param {ModelManager} modelManager - the ModelManager that manages this
     * ModelFile
     * @param {string} definitions - The ACLs as a string.
     * @throws {InvalidModelException}
     */
    constructor(modelManager, definitions) {
        this.modelManager = modelManager;
        this.rules = [];

        if(!definitions || typeof definitions !== 'string') {
            throw new Error('ModelFile expects a Concerto model as a string as input.');
        }
        this.definitions = definitions;

        try {
            this.ast = parser.parse(definitions);
        }
        catch(err) {
            if(err.location && err.location.start) {
                throw new ParseException( err.message +  ' Line ' + err.location.start.line + ' column ' + err.location.start.column, err.location );
            }
            else {
                throw err;
            }
        }

        for(let n=0; n < this.ast.rules.length; n++ ) {
            let thing = this.ast.rules[n];
            this.rules.push( new AclRule(this, thing));
        }
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
     * Returns the ModelManager associated with this ModelFile
     *
     * @return {ModelManager} The ModelManager for this ModelFile
     */
    getModelManager() {
        return this.modelManager;
    }

    /**
     * Validates the ModelFile.
     *
     * @throws {IllegalModelException} if the model is invalid
     * @private
     */
    validate() {
        for(let n=0; n < this.rules.length; n++) {
            let aclRule = this.rules[n];
            aclRule.validate();
        }
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

    /**
     * Convert the specified JSON into an instance of an ACL file.
     * @param {ModelManager} modelManager - the ModelManager that manages this
     * ModelFile
     * @param {Object} aclFile - A serialized instance of an AclFile.
     * @param {string} aclFile.definitions - The definitions for the AclFile.
     * @return {AclFile} An instance of an AclFile.
     */
    static fromJSON(modelManager, aclFile) {
        return new AclFile(modelManager, aclFile.definitions);
    }

    /**
     * Convert this ACL file into an object that is suitable for converting
     * into a JSON string for serialization purposes.
     * @return {Object} An object suitable for converting into a JSON string.
     */
    fromJSON() {
        return {
            definitions: this.definitions,
        };
    }
}

module.exports = AclFile;
