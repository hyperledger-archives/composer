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

const IllegalModelException = require('../introspect/illegalmodelexception');
const ModelUtil = require('../modelutil');

/**
 * ModelBinding captures a binding to a model element. A ModelBinding can
 * be to a namespace, a class, or an instance of a class, and may optionally
 * by bound to a named variable.
 *
 * @private
 * @class
 * @memberof module:ibm-concerto-common
 */
class ModelBinding {

    /**
     * Create an ModelBinding from an Abstract Syntax Tree. The AST is the
     * result of parsing.
     *
     * @param {AclRule} aclRule - the AclRule for this ModelBinding
     * @param {Object} ast - the AST created by the parser
     * @throws {IllegalModelException}
     */
    constructor(aclRule, ast) {
        if(!aclRule || !ast) {
            throw new IllegalModelException('Invalid AclRule or AST');
        }

        this.ast = ast;
        this.aclRule = aclRule;
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
     * Returns the AclRule that owns this ModelBinding.
     *
     * @return {AclRule} the owning AclRule
     */
    getAclRule() {
        return this.aclRule;
    }

    /**
     * Process the AST and build the model
     *
     * @throws {InvalidModelException}
     * @private
     */
    process() {
        this.qualifiedName = this.ast.qualifiedName;
        this.instanceId = null;

        if(this.ast.instanceId) {
            this.instanceId = this.ast.instanceId.name;
        }

        this.variableName = null;
        if(this.ast.variableName) {
            this.variableName = this.ast.variableName.name;
        }
    }

    /**
     * Returns strind representation of this object
     *
     * @return {string} the string version of the object
     */
    toString() {
        return 'ModelBinding ' + this.qualifiedName + '#' + this.instanceId + ':' + this.variableName;
    }

    /**
     * Returns the fully qualified name of the model element for this ModelBinding.
     *
     * @return {string} the fully qualified model name
     */
    getFullyQualifiedName() {
        return this.qualifiedName;
    }

    /**
     * Returns the identifier of the instance of the model element for this ModelBinding.
     *
     * @return {string} the identifier of the instance, or null
     */
    getInstanceIdentifier() {
        return this.instanceId;
    }

    /**
     * Returns the name of the variable of the model element for this ModelBinding.
     *
     * @return {string} the name of the variable, or null
     */
    getVariableName() {
        return this.variableName;
    }

    /**
     * Semantic validation of the structure of this ModelBinding.
     *  Algorithm:
     *
     * If we have a variableName, then qualifiedName cannot be a namespace
     * If we have an instanceId, then qualifiedName cannot be a namespace
     *
     * We assume we have ns.class.property and try to resolve the class in ns
     * - On success
     * -- Check that the property exists
     * - On failure
     * -- Try to resolve ns.class
     * -- On failure
     * --- If instanceId and variableName are null
     * --- Try to resolve ns
     *
     * @throws {InvalidModelException}
     * @private
     */
    validate() {
        const mm = this.getAclRule().getAclFile().getModelManager();

        // assume qualifiedName is ns.class.property
        const nsDotClass = ModelUtil.getNamespace(this.qualifiedName);
        const ns = ModelUtil.getNamespace(nsDotClass);
        const className = ModelUtil.getShortName(nsDotClass);
        const propertyName = ModelUtil.getShortName(this.qualifiedName);
        const modelFile = mm.getModelFile(ns);

        if(modelFile) {
            const classDeclaration = modelFile.getLocalType(className);
            if(classDeclaration) {
                const property = classDeclaration.getProperty(propertyName);
                if(!property) {
                    throw new Error('Failed to find property ' + this.qualifiedName);
                }
            }
        }
        else {
            // assume qualifiedName is ns.class
            const ns = ModelUtil.getNamespace(this.qualifiedName);
            const className = ModelUtil.getShortName(this.qualifiedName);
            const modelFile = mm.getModelFile(ns);

            if(modelFile) {
                const classDeclaration = modelFile.getLocalType(className);
                if(!classDeclaration) {
                    throw new Error('Failed to find class ' + this.qualifiedName);
                }
            }
            else if(this.instanceId === null && this.variableName === null) {
                // assume namespace
                const modelFile = mm.getModelFile(this.qualifiedName);
                if(!modelFile) {
                    throw new Error('Failed to find namespace ' + this.qualifiedName);
                }
            }
            else {
                throw new Error('Failed to resolve ' + this.qualifiedName);
            }
        }
    }

    /**
     * Returns a new object representing this function declaration that is
     * suitable for serializing as JSON.
     * @return {Object} A new object suitable for serializing as JSON.
     */
    toJSON() {
        let result = {
            qualifiedName: this.qualifiedName,
            instanceId: this.instanceId,
            variableName: this.variableName
        };
        return result;
    }
}

module.exports = ModelBinding;
