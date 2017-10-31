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

const Logger = require('../log/logger');
const LOG = Logger.getLog('WhereAstValidator');
const IllegalModelException = require('../introspect/illegalmodelexception');
const RelationshipDeclaration = require('../introspect/relationshipdeclaration');
const InvalidQueryException = require('./invalidqueryexception');
const Globalize = require('../globalize');

const BOOLEAN_OPERATORS = ['==', '!='];
const OPERATORS = ['>', '>=', '==', '!=', '<=', '<', 'CONTAINS'];

/**
 * The query validator visits the AST for a WHERE and checks that all the model references exist
 * @private
 */
class WhereAstValidator {

    /**
     * Creates the validator
     * @param {ClassDeclaration} classDeclaration - the type for the WHERE
     */
    constructor(classDeclaration) {
        if (!classDeclaration) {
            throw new Error('Invalid class declaration');
        }
        this.classDeclaration = classDeclaration;
    }

    /**
     * Visitor design pattern; handle all objects from the query manager.
     * @param {Object} thing The object being visited.
     * @param {Object} parameters The parameters.
     * @return {Object} The result of visiting, or null.
     * @private
     */
    visit(thing, parameters) {
        const method = 'visit';
        LOG.entry(method, thing, parameters);
        let result = null;

        if (thing.type === 'BinaryExpression') {
            result = this.visitBinaryExpression(thing, parameters);
        } else if (thing.type === 'Identifier') {
            result = this.visitIdentifier(thing, parameters);
        } else if (thing.type === 'Literal') {
            result = this.visitLiteral(thing, parameters);
        } else if (thing.type === 'ArrayExpression') {
            result = this.visitArrayExpression(thing, parameters);
        } else if (thing.type === 'MemberExpression') {
            result = this.visitMemberExpression(thing, parameters);
        } else {
            throw new Error('Unsupported type: ' + typeof thing + ', value: ' + JSON.stringify(thing));
        }
        LOG.exit(method);
        return result;
    }

    /**
     * Visitor design pattern; handle a binary expression.
     * @param {Object} ast The abstract syntax tree being visited.
     * @param {Object} parameters The parameters.
     * @return {Object} The result of visiting, or null.
     * @private
     */
    visitBinaryExpression(ast, parameters) {
        const method = 'visitBinaryExpression';
        LOG.entry(method, ast, parameters);

        // Binary expressions are handled differently in Mango based on the type,
        // so figure out the type and handle it appropriately.
        const arrayCombinationOperators = ['AND', 'OR'];
        if (arrayCombinationOperators.indexOf(ast.operator) !== -1) {
            this.visitArrayCombinationOperator(ast, parameters);
        } else if (ast.operator === 'CONTAINS') {
            this.visitContainsOperator(ast, parameters);
        } else {
            this.visitConditionOperator(ast, parameters);
        }

        LOG.exit(method);
        return null;
    }

    /**
     * Visitor design pattern; handle an array combination operator.
     * Array combination operators are operators that act on two or more pieces
     * of data, such as 'AND' and 'OR'.
     * @param {Object} ast The abstract syntax tree being visited.
     * @param {Object} parameters The parameters.
     * @return {Object} The result of visiting, or null.
     * @private
     */
    visitArrayCombinationOperator(ast, parameters) {
        const method = 'visitArrayCombinationOperator';
        LOG.entry(method, ast, parameters);

        this.visit(ast.left, parameters);
        this.visit(ast.right, parameters);
        LOG.exit(method);
        return null;
    }

    /**
     * Visitor design pattern; handle an contains operator.
     * @param {Object} ast The abstract syntax tree being visited.
     * @param {Object} parameters The parameters.
     * @return {Object} The result of visiting, or null.
     * @private
     */
    visitContainsOperator(ast, parameters) {
        const method = 'visitContainsOperator';
        LOG.entry(method, ast, parameters);

        // Check we haven't already entered a scope - let's keep it simple!
        if (parameters.validationDisabled) {
            throw new Error('A CONTAINS expression cannot be nested within another CONTAINS expression');
        }

        // Disable validation.
        parameters.validationDisabled = true;

        // Resolve both the left and right sides of the expression.
        let left = this.visit(ast.left, parameters);
        let right = this.visit(ast.right, parameters);

        // Enable validation again.
        parameters.validationDisabled = false;

        // Initialize the scopes array.
        parameters.scopes = parameters.scopes || [];

        // Look for a scope name.
        if (typeof left === 'string' && !left.startsWith('_$')) {
            parameters.scopes.push(left);
        } else if (typeof right === 'string' && !right.startsWith('_$')) {
            parameters.scopes.push(right);
        } else {
            throw new Error('A property name is required on one side of a CONTAINS expression');
        }

        // Re-resolve both the left and right sides of the expression.
        left = this.visit(ast.left, parameters);
        right = this.visit(ast.right, parameters);

        // Pop the scope name off again.
        parameters.scopes.pop();

        LOG.exit(method);
        return null;
    }

    /**
     * Visitor design pattern; handle a condition operator.
     * Condition operators are operators that compare two pieces of data, such
     * as '>=' and '!='.
     * @param {Object} ast The abstract syntax tree being visited.
     * @param {Object} parameters The parameters.
     * @return {Object} The result of visiting, or null.
     * @private
     */
    visitConditionOperator(ast, parameters) {
        const method = 'visitConditionOperator';
        LOG.entry(method, ast, parameters);

        // Resolve both the left and right sides of the expression.
        const left = this.visit(ast.left, parameters);
        const right = this.visit(ast.right, parameters);

        // Bypass the following validation if required. This will be set during
        // the first pass of a CONTAINS when we are trying to figure out the name
        // of the current scope so we can correctly validate model references.
        if (parameters.validationDisabled) {
            LOG.exit(method);
            return null;
        }

        if (typeof left === 'string') {
            if (!left.startsWith('_$')) {
                const property = this.verifyProperty(left, parameters);
                this.verifyOperator(property, ast.operator);
            }
            if (right && right.type === 'Literal') {
                const property = this.verifyProperty(left, parameters);
                this.verifyTypeCompatibility(property, right.value);
            }
        }

        if (typeof right === 'string') {
            if (!right.startsWith('_$')) {
                const property = this.verifyProperty(right, parameters);
                this.verifyOperator(property, ast.operator);
            }
            if (left && left.type === 'Literal') {
                const property = this.verifyProperty(right, parameters);
                this.verifyTypeCompatibility(property, left.value);
            }
        }

        LOG.exit(method);
        return null;
    }


    /**
     * Checks that a property exists on the class declaration
     * @param {string} propertyName The property path
     * @param {object} parameters The parameters
     * @throws {IllegalModelException} if property path does not resolve to a property
     * @returns {Property} the property
     * @private
     */
    verifyProperty(propertyName, parameters) {

        // If we have entered a scope, for example a CONTAINS, then we need
        // to prepend the current scope to the property name.
        let actualPropertyName = propertyName;
        if (parameters.scopes && parameters.scopes.length) {
            actualPropertyName = parameters.scopes.concat(propertyName).join('.');
        }

        const property = this.classDeclaration.getNestedProperty(actualPropertyName);
        if (!property) {
            throw new IllegalModelException('Property ' + propertyName + ' not found on type ' + this.classDeclaration, this.classDeclaration.getModelFile(), this.classDeclaration. ast.location);
        }
        return property;
    }

    /**
     * Checks that an operator can be used with a property
     * @param {Property} property The property being used for comparison
     * @param {string} operator The operator being used
     * @throws {Error} if the operator is incompatible with the property
     * @private
     */
    verifyOperator(property, operator) {

        let valid = 0;

        if (property.getType() === 'Boolean') {
            valid = BOOLEAN_OPERATORS.indexOf(operator);
        }
        else {
            valid = OPERATORS.indexOf(operator);
        }

        if( valid === -1) {
            WhereAstValidator.reportIncompatibleOperator(this.classDeclaration, property, operator);
        }
    }

    /**
     * Checks that a literal value can be compared with a property.
     * @param {Property} property The property property to be checked
     * @param {Object} value The value being compared
     * @throws {Error} if the literal value is incompatible with the property
     * @private
     */
    verifyTypeCompatibility(property, value) {

        let dataType = typeof value;

        if (dataType === 'undefined' || dataType === 'symbol') {
            WhereAstValidator.reportIncompatibleType(this.classDeclaration, property, value);
        }

        let invalid = false;

        // Arrays of concepts can't currently be specified as literal values.
        if (property.isArray()) {
            WhereAstValidator.reportUnsupportedType(this.classDeclaration, property, value);
        }

        if (property.isPrimitive()) {
            switch (property.getType()) {
            case 'String':
                if (dataType !== 'string') {
                    invalid = true;
                }
                break;
            case 'Double':
            case 'Long':
            case 'Integer':
                if (dataType !== 'number') {
                    invalid = true;
                }
                break;
            case 'Boolean':
                if (dataType !== 'boolean') {
                    invalid = true;
                }
                break;
            case 'DateTime':
                if (dataType !== 'string') {
                    invalid = true;
                } else {
                    invalid = isNaN(Date.parse(value));
                }
                break;
            }

            if (invalid) {
                WhereAstValidator.reportIncompatibleType(this.classDeclaration, property, value);
            }
        } else {
            if (property instanceof RelationshipDeclaration) {
                if (dataType !== 'string') {
                    WhereAstValidator.reportIncompatibleRelationship(this.classDeclaration, property, value);
                }
            } else if (property.isTypeEnum()) {
                if (dataType !== 'string') {
                    WhereAstValidator.reportIncompatibleEnum(this.classDeclaration, property, value);
                }
            } else {
                WhereAstValidator.reportUnsupportedType(this.classDeclaration, property, value);
            }
        }
    }

    /**
     * Visitor design pattern; handle an identifier.
     * Identifiers are either references to properties in the data being queried,
     * or references to a query parameter (these are of the format _$varname).
     * @param {Object} ast The abstract syntax tree being visited.
     * @param {Object} parameters The parameters.
     * @return {Object} The result of visiting, or null.
     * @private
     */
    visitIdentifier(ast, parameters) {
        const method = 'visitIdentifier';
        LOG.entry(method, ast, parameters);
        let result = ast.name;
        LOG.exit(method, result);
        return result;
    }

    /**
     * Visitor design pattern; handle a literal.
     * Literals are just plain old literal values ;-)
     * @param {Object} ast The abstract syntax tree being visited.
     * @param {Object} parameters The parameters.
     * @return {Object} The result of visiting, or null.
     * @private
     */
    visitLiteral(ast, parameters) {
        const method = 'visitLiteral';
        LOG.entry(method, ast, parameters);
        LOG.exit(method);
        return ast;
    }

    /**
     * Visitor design pattern; handle an array expression.
     * @param {Object} ast The abstract syntax tree being visited.
     * @param {Object} parameters The parameters.
     * @return {Object} The result of visiting, or null.
     * @private
     */
    visitArrayExpression(ast, parameters) {
        const method = 'visitArrayExpression';
        LOG.entry(method, ast, parameters);
        const selector = ast.elements.map((element) => {
            return this.visit(element, parameters);
        });
        LOG.exit(method, selector);
        return selector;
    }

    /**
     * Visitor design pattern; handle a member expression.
     * @param {Object} ast The abstract syntax tree being visited.
     * @param {Object} parameters The parameters.
     * @return {Object} The result of visiting, or null.
     * @private
     */
    visitMemberExpression(ast, parameters) {
        const method = 'visitMemberExpression';
        LOG.entry(method, ast, parameters);
        let result = null;
        const object = this.visit(ast.object, parameters);
        const path = this.visit(ast.property, parameters);

        if (object) {
            result = `${object}.${path}`;
            const property = this.classDeclaration.getNestedProperty(result);
            if (!property) {
                throw new IllegalModelException('Property ' + result + ' not found on type ' + this.classDeclaration, this.classDeclaration.getModelFile(), this.classDeclaration.ast.location);
            }
        }

        LOG.exit(method, result);
        return result;
    }

    /**
     * Throw a new error for a model violation.
     * @param {ClassDeclaration} classDeclaration - the identifier of this instance.
     * @param {Property} property - the name of the field.
     * @param {*} value - the value of the field.
     * @throws {ValidationException} the exception
     * @private
     */
    static reportIncompatibleType(classDeclaration, property, value) {
        let isArray = property.isArray() ? '[]' : '';
        let typeOfValue = typeof value;

        let formatter = Globalize.messageFormatter('whereastvalidator-propertytypeviolation');
        throw new InvalidQueryException(formatter({
            propertyName: property.getName(),
            fieldType: property.getType() + isArray,
            value: value,
            typeOfValue: typeOfValue
        }));
    }

    /**
     * Throw a new error for a model violation.
     * @param {ClassDeclaration} classDeclaration - the identifier of this instance.
     * @param {Property} property - the name of the field.
     * @param {string} operator - the operator used
     * @throws {ValidationException} the exception
     * @private
     */
    static reportIncompatibleOperator(classDeclaration, property, operator) {
        let isArray = property.isArray() ? '[]' : '';

        let formatter = Globalize.messageFormatter('whereastvalidator-invalidoperator');
        throw new InvalidQueryException(formatter({
            propertyName: property.getName(),
            fieldType: property.getType() + isArray,
            operator: operator
        }));
    }

    /**
     * Throw a new error for a model violation.
     * @param {ClassDeclaration} classDeclaration - the identifier of this instance.
     * @param {Property} property - the name of the field.
     * @param {*} value - the value of the field.
     * @param {Field} field - the field
     * @throws {ValidationException} the exception
     * @private
     */
    static reportIncompatibleEnum(classDeclaration, property, value) {
        let typeOfValue = typeof value;

        let formatter = Globalize.messageFormatter('whereastvalidator-enum-propertytypeviolation');
        throw new InvalidQueryException(formatter({
            propertyName: property.getName(),
            value: value,
            typeOfValue: typeOfValue
        }));
    }

    /**
     * Throw a new error for a model violation.
     * @param {ClassDeclaration} classDeclaration - the identifier of this instance.
     * @param {Property} property - the name of the field.
     * @param {*} value - the value of the field.
     * @param {Field} field - the field
     * @throws {ValidationException} the exception
     * @private
     */
    static reportIncompatibleRelationship(classDeclaration, property, value) {
        let typeOfValue = typeof value;

        let formatter = Globalize.messageFormatter('whereastvalidator-relationship-propertytypeviolation');
        throw new InvalidQueryException(formatter({
            propertyName: property.getName(),
            value: value,
            typeOfValue: typeOfValue
        }));
    }

    /**
     * Throw a new error for a model violation.
     * @param {ClassDeclaration} classDeclaration - the identifier of this instance.
     * @param {Property} property - the name of the field.
     * @param {*} value - the value of the field.
     * @param {Field} field - the field
     * @throws {ValidationException} the exception
     * @private
     */
    static reportUnsupportedType(classDeclaration, property) {
        let isArray = property.isArray() ? '[]' : '';

        let formatter = Globalize.messageFormatter('whereastvalidator-unsupportedtype');
        throw new InvalidQueryException(formatter({
            propertyName: property.getName(),
            fieldType: property.getType() + isArray
        }));
    }
}

module.exports = WhereAstValidator;
