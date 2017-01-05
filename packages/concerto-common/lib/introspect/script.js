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

const JavaScriptParser = require('../codegen/javascriptparser');
const FunctionDeclaration = require('../introspect/functiondeclaration');

/**
 * <p>
 * An executable script.
 * </p>
 * @private
 * @class
 * @memberof module:ibm-concerto-common
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

        const parser = new JavaScriptParser(this.contents);

        const functions = parser.getFunctions();

        for(let n=0; n < functions.length; n++) {
            const func = functions[n];
            const functionDeclaration = new FunctionDeclaration(this.modelManager, this.language, func.name, func.visibility,
              func.returnType, func.throws, func.parameterNames, func.parameterTypes, func.decorators, func.functionText );
            functionDeclaration.validate();
            this.functions.push( functionDeclaration );
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
     * Returns the identifier of the script
     * @return {string} the identifier of the script
     */
    getIdentifier() {
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
     * Return a JSON safe representation of this object, primarily for logging.
     * @return {object} A JSON safe representation of this object.
     */
    toJSON() {
        return {
            identifier: this.identifier,
            language: this.language
        };
    }
}

module.exports = Script;
