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

const TransactionDeclaration = require('./transactiondeclaration');
const IllegalModelException = require('./illegalmodelexception');
const Globalize = require('../globalize');

/**
 * FunctionDeclaration defines a function that has been defined
 * in a model file. If the name of the function starts with 'on'
 * then the name of the function denotes the name of a transaction
 * declaration that the function processes.
 * @private
 */
class FunctionDeclaration {

    /**
     * Create a ClassDeclaration from an Abstract Syntax Tree. The AST is the
     * result of parsing.
     *
     * @param {ModelFile} modelFile - the ModelFile for this class
     * @param {string} ast - the AST created by the parser
     * @throws {IllegalModelException}
     */
    constructor(modelFile, ast) {
        if(!modelFile || !ast) {
            throw new IllegalModelException(Globalize.formatMessage('classdeclaration-constructor-modelastreq'));
        }

        this.ast = ast;
        this.modelFile = modelFile;
        this.process();
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
     * Returns the ModelFile that defines this class.
     *
     * @return {ModelFile} the owning ModelFile
     */
    getModelFile() {
        return this.modelFile;
    }

    /**
     * Returns the text of this function.
     *
     * @return {string} the text that defines the function
     */
    getFunctionText() {
        return this.functionText;
    }

    /**
     * Process the AST and build the model
     *
     * @throws {InvalidModelException}
     * @private
     */
    process() {
        this.name = this.ast.id.name;
        this.functionText = this.ast.functionText;
        this.params = [];

        for(let n=0; n < this.ast.params.length;n++) {
            this.params.push(this.ast.params[n].name);
        }
    }

    /**
     * Semantic validation of the structure of this function.
     *
     * @throws {InvalidModelException}
     * @private
     */
    validate() {
        if(this.name.startsWith('on')) {
            const transactionClassName = this.getTransactionDeclarationName();
            let classDecl = null;

            if(this.getModelFile().isImportedType(transactionClassName)) {
                let fqnSuper = this.getModelFile().resolveImport(transactionClassName);
                classDecl = this.modelFile.getModelManager().getType(fqnSuper);
            }
            else {
                classDecl = this.getModelFile().getType(transactionClassName);
            }

            if(classDecl===null) {
                throw new IllegalModelException('Could not find transaction type ' + transactionClassName + ' for transaction processing function ' + this.name );
            }

            if(!(classDecl instanceof TransactionDeclaration)) {
                throw new IllegalModelException('Function ' + this.getName() + ' processes ' + transactionClassName + ' which is not a transaction.');
            }
        }
    }

    /**
     * Returns the short name of the function (not including namespace).
     *
     * @return {string} the name of the function.
     */
    getName() {
        return this.name;
    }

    /**
     * Returns the short name of the transaction declaration
     * that is being processed. This is calculated by removing
     * the 'on' prefix from the function name.
     * If the function name does not start with 'on' then null
     *
     * @return {string} the name of the transaction declaration.
     */
    getTransactionDeclarationName() {
        if(this.name.startsWith('on')) {
            return this.name.substring(2);
        }
        else {
            return null;
        }
    }

    /**
     * Returns the names of the parameters processed by the function.
     *
     * @return {string[]} the names of the parameters.
     */
    getParameters() {
        return this.params;
    }

    /**
     * Returns the fully qualified name of this function.
     * The name will include the namespace if present.
     *
     * @return {string} the fully-qualified name of this function
     */
    getFullyQualifiedName() {
        return this.modelFile.getNamespace() + '.' + this.name;
    }

    /**
     * Returns a new object representing this function declaration that is
     * suitable for serializing as JSON.
     * @return {Object} A new object suitable for serializing as JSON.
     */
    toJSON() {
        return {
            name: this.name,
            params: this.params,
            functionText: this.functionText
        };
    }

}

module.exports = FunctionDeclaration;
