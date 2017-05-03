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

const IllegalModelException = require('../introspect/illegalmodelexception');
const ModelUtil = require('../modelutil');

/**
 * ModelBinding captures a binding to a model element. A ModelBinding can
 * be to a namespace, a class, or an instance of a class, and may optionally
 * be bound to a named variable.
 *
 * @private
 * @class
 * @memberof module:composer-common
 */
class ModelBinding {

    /**
     * Create an ModelBinding from an Abstract Syntax Tree. The AST is the
     * result of parsing.
     *
     * @param {AclRule} aclRule - the AclRule for this ModelBinding
     * @param {Object} ast - the AST created by the parser
     * @param {Object} variableAst - the variable binding AST created by the parser
     * @throws {IllegalModelException}
     */
    constructor(aclRule, ast, variableAst) {
        if(!aclRule || !ast) {
            throw new IllegalModelException('Invalid AclRule or AST');
        }

        this.ast = ast;
        this.aclRule = aclRule;
        if(variableAst) {
            this.variableAst = variableAst;
        }
        else {
            this.variableAst = null;
        }
        this.classDeclaration = null;

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
     * @throws {IllegalModelException}
     * @private
     */
    process() {
        this.qualifiedName = this.ast.qualifiedName;
        this.instanceId = null;

        if(this.ast.instanceId) {
            this.instanceId = this.ast.instanceId;
        }

        this.variableName = null;
        if(this.variableAst) {
            this.variableName = this.variableAst.name;
        }
    }

    /**
     * Returns strind representation of this object
     *
     * @return {string} the string version of the object
     */
    toString() {
        let result = 'ModelBinding ' + this.qualifiedName;
        if(this.instanceId) {
            result += '#' + this.instanceId;
        }

        if(this.variableName) {
            result += ':' + this.variableName;
        }

        return result;
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
     * <p>
     * Algorithm:
     * </p>
     * <ul>
     * <li>If we have a variableName, then qualifiedName cannot be a namespace
     * <li>If we have an instanceId, then qualifiedName cannot be a namespace
     * </ul>
     * <pre>
     * We assume we have ns.class.property and try to resolve the class in ns
     * - On success
     * -- Check that the property exists
     * - On failure
     * -- Try to resolve ns.class
     * -- On failure
     * --- If instanceId and variableName are null
     * --- Try to resolve ns
     * </pre>
     * @throws {IllegalModelException}
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
            if(!classDeclaration) {
                throw new Error('Failed to find class ' + nsDotClass);
            }
            this.classDeclaration = classDeclaration;
            const property = classDeclaration.getProperty(propertyName);
            if(!property) {
                throw new Error('Failed to find property ' + this.qualifiedName);
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
                this.classDeclaration = classDeclaration;
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
     * Get the class declaration for the class that this instance is bound to.
     * @return {ClassDeclaration} The class declaration for the class that
     * this instance is bound to, or null if this instance is bound to a namespace.
     */
    getClassDeclaration() {
        return this.classDeclaration;
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
