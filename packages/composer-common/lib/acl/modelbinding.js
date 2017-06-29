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
     *
     * @throws {IllegalModelException}
     * @private
     */
    validate() {
        const mm = this.getAclRule().getAclFile().getModelManager();

        const ns = ModelUtil.getNamespace(this.qualifiedName);
        if (ModelUtil.isRecursiveWildcardName(this.qualifiedName)) {
            const namespaces = mm.getNamespaces();

            if (namespaces.findIndex(function (element, index, array) {
                return (ns === element || element.startsWith(ns + '.'));
            })=== -1) {
                throw new IllegalModelException('Failed to find namespace ' + this.qualifiedName);
            }
        } else if (ModelUtil.isWildcardName(this.qualifiedName)) {
            const modelFile = mm.getModelFile(ns);

            if(!modelFile) {
                throw new IllegalModelException('Failed to find namespace ' + this.qualifiedName);
            }
        } else {
            const modelFile = mm.getModelFile(ns);

            if(!modelFile) {
                throw new IllegalModelException('Failed to find namespace ' + ns);
            }

            const className = ModelUtil.getShortName(this.qualifiedName);
            const classDeclaration = modelFile.getLocalType(className);

            if(!classDeclaration) {
                throw new IllegalModelException('Failed to find class ' + this.qualifiedName);
            }

            this.classDeclaration = classDeclaration;
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

}

module.exports = ModelBinding;
