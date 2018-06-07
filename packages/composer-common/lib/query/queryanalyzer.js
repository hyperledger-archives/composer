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

const Limit = require('./limit');
const Logger = require('../log/logger');
const OrderBy = require('./orderby');
const Query = require('./query');
const Select = require('./select');
const Skip = require('./skip');
const Where = require('./where');
const RelationshipDeclaration = require('../introspect/relationshipdeclaration');
const LOG = Logger.getLog('QueryAnalyzer');

/**
 * The query analyzer visits a query and extracts the names and types of all parameters
 * @private
 */
class QueryAnalyzer {

    /**
     * Create an Query from an Abstract Syntax Tree. The AST is the
     * result of parsing.
     *
     * @param {Query} query - the composer query for process
     * @throws {IllegalModelException}
     */
    constructor(query) {
        if (!query) {
            throw new Error('Invalid query');
        }

        this.query = query;
    }

    /**
     * Extract the names and types of query parameters
     * @return {object[]} The names and types of the query parameters
     */
    analyze() {
        const method = 'analyze';
        LOG.entry(method);
        const result = this.query.accept(this, {});
        LOG.exit(method, result);

        return result;
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
        if (thing instanceof Query) {
            result = this.visitQuery(thing, parameters);
        } else if (thing instanceof Select) {
            result = this.visitSelect(thing, parameters);
        } else if (thing instanceof Where) {
            result = this.visitWhere(thing, parameters);
        } else if (thing instanceof OrderBy) {
            result = this.visitOrderBy(thing, parameters);
        } else if (thing instanceof Limit) {
            result = this.visitLimit(thing, parameters);
        } else if (thing instanceof Skip) {
            result = this.visitSkip(thing, parameters);
        } else if (thing.type === 'BinaryExpression') {
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
            throw new Error('Unrecognised type: ' + typeof thing + ', value: ' + JSON.stringify(thing));
        }
        LOG.exit(method, result);
        return result;
    }

    /**
     * Visitor design pattern; handle a query by visiting the select statement.
     * @param {Query} query The query being visited.
     * @param {Object} parameters The parameters.
     * @return {Object} The result of visiting, or null.
     * @private
     */
    visitQuery(query, parameters) {
        const method = 'visitQuery';
        LOG.entry(method, query, parameters);

        // Process the select statement, which will return a Mango query.
        const select = query.getSelect();
        const requiredParameters = [];
        parameters.requiredParameters = requiredParameters;
        const parametersToUse = {};
        parameters.parametersToUse = parametersToUse;
        const result = select.accept(this, parameters);

        LOG.exit(method, result);
        return result;
    }

    /**
     * Visitor design pattern; handle a select statement.
     * @param {Select} select The select statement being visited.
     * @param {Object} parameters The parameters.
     * @return {Object} The result of visiting, or null.
     * @private
     */
    visitSelect(select, parameters) {
        const method = 'visitSelect';
        LOG.entry(method, select, parameters);

        let results = [];

        // Handle the where clause, if it exists.
        const where = select.getWhere();
        if (where) {
            results = results.concat(where.accept(this, parameters));
        }

        // Handle the order by clause, if it exists.
        const orderBy = select.getOrderBy();
        if (orderBy) {
            results = results.concat(orderBy.accept(this, parameters));
        }

        // Handle the limit clause, if it exists. Note that the limit
        // clause can reference a parameter.
        const limit = select.getLimit();
        if (limit) {
            results = results.concat(limit.accept(this, parameters));
        }

        // Handle the skip clause, if it exists. Note that the skip
        // clause can reference a parameter.
        const skip = select.getSkip();
        if (skip) {
            results = results.concat(skip.accept(this, parameters));
        }

        LOG.exit(method, results);
        return results;
    }

    /**
     * Visitor design pattern; handle a where statement.
     * @param {Where} where The where statement being visited.
     * @param {Object} parameters The parameters.
     * @return {Object} The result of visiting, or null.
     * @private
     */
    visitWhere(where, parameters) {
        const method = 'visitWhere';
        LOG.entry(method, where, parameters);

        // Simply visit the AST, which will generate a selector.
        // The root of the AST is probably a binary expression.
        const result = this.visit(where.getAST(), parameters);
        LOG.exit(method, result);
        return result;
    }

    /**
     * Visitor design pattern; handle an order by statement.
     * @param {OrderBy} orderBy The order by statement being visited.
     * @param {Object} parameters The parameters.
     * @return {Object} The result of visiting, or null.
     * @private
     */
    visitOrderBy(orderBy, parameters) {
        const method = 'visitOrderBy';
        LOG.entry(method, orderBy, parameters);
        const result = [];
        LOG.exit(method, result);
        return result;
    }

    /**
     * Visitor design pattern; handle a limit statement.
     * @param {Limit} limit The limit statement being visited.
     * @param {Object} parameters The parameters.
     * @return {Object} The result of visiting, or null.
     * @private
     */
    visitLimit(limit, parameters) {
        const method = 'visitLimit';
        LOG.entry(method, limit, parameters);
        // Get the limit value from the AST.
        const result = this.visit(limit.getAST(), parameters);
        if (result.length > 0) {
            result[0].type = 'Integer';
        }
        LOG.exit(method, result);
        return result;
    }

    /**
     * Visitor design pattern; handle a skip statement.
     * @param {Skip} skip The skip statement being visited.
     * @param {Object} parameters The parameters.
     * @return {Object} The result of visiting, or null.
     * @private
     */
    visitSkip(skip, parameters) {
        const method = 'visitSkip';
        LOG.entry(method, skip, parameters);
        // Get the skip value from the AST.
        const result = this.visit(skip.getAST(), parameters);

        if (result.length > 0) {
            result[0].type = 'Integer';
        }
        LOG.exit(method, result);
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
        let result;
        if (arrayCombinationOperators.indexOf(ast.operator) !== -1) {
            result = this.visitArrayCombinationOperator(ast, parameters);
        } else if (ast.operator === 'CONTAINS') {
            result = this.visitContainsOperator(ast, parameters);
        } else {
            result = this.visitConditionOperator(ast, parameters);
        }

        LOG.exit(method, result);
        return result;
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

        let result = [];
        result = result.concat(this.visit(ast.left, parameters));
        result = result.concat(this.visit(ast.right, parameters));

        // Removing duplicate parameters
        let paramNames = [];
        for (let i = 0; i < result.length; i++) {
            paramNames[result[i].name] = result[i];
        }
        let resultNoDuplicates = [];
        for (let key in paramNames) {
            resultNoDuplicates.push(paramNames[key]);
        }
        LOG.exit(method, resultNoDuplicates);
        return resultNoDuplicates;
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

        // if the left is a string, it is the name of a property
        // and we infer the type of the right from the model
        // if the right is a parameter
        let result = [];
        if (typeof left === 'string' && (right instanceof Array && right.length > 0)) {
            if(right[0].type === null) {
                right[0].type = this.getParameterType(left, parameters);
            }
            result = result.concat(right);
        }

        // if the right is a string, it is the name of a property
        // and we infer the type of the left from the model
        // if the left is a parameter
        if (typeof right === 'string' && (left instanceof Array && left.length > 0)) {
            if(left[0].type === null) {
                left[0].type = this.getParameterType(right, parameters);
            }
            result = result.concat(left);
        }

        LOG.exit(method, result);
        return result;
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

        let result = [];

        // Grab both side of the expression.
        const rhs = this.visit(ast.right, parameters);
        const lhs = this.visit(ast.left, parameters);

        // Bypass the following validation if required. This will be set during
        // the first pass of a CONTAINS when we are trying to figure out the name
        // of the current scope so we can correctly validate model references.
        if (parameters.validationDisabled) {
            LOG.exit(method, result);
            return result;
        }

        // if the rhs is a string, it is the name of a property
        // and we infer the type of the lhs from the model
        // if the lhs is a parameter
        if (typeof rhs === 'string' && (lhs instanceof Array && lhs.length > 0)) {
            lhs[0].type = this.getParameterType(rhs, parameters);
            result = result.concat(lhs);
        }

        // if the lhs is a string, it is the name of a property
        // and we infer the type of the rhs from the model
        // if the rhs is a parameter
        if (typeof lhs === 'string' && (rhs instanceof Array && rhs.length > 0)) {
            rhs[0].type = this.getParameterType(lhs, parameters);
            result = result.concat(rhs);
        }

        LOG.exit(method, result);
        return result;
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

        // Check to see if this is a parameter reference.
        const parameterMatch = ast.name.match(/^_\$(.+)/);
        if (parameterMatch) {
            const parameterName = parameterMatch[1];
            LOG.exit(method, parameterName);

            // We return a parameter object with a null type
            // performing the type inference in the parent visit
            return [{
                name: parameterName,
                type: null
            }];
        }

        // Otherwise it's a property name.
        const selector = ast.name;
        LOG.exit(method, selector);
        return selector;

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
        const result = [];
        LOG.exit(method, result);
        return result;
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
        const result = ast.elements.map((element) => {
            return this.visit(element, parameters);
        }).filter((element) => {
            return !(Array.isArray(element) && element.length === 0);
        });
        LOG.exit(method, result);
        return result;
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
        const property = this.visit(ast.property, parameters);
        const object = this.visit(ast.object, parameters);
        const selector = `${object}.${property}`;
        LOG.exit(method, selector);
        return selector;
    }

    /**
     * Get the parameter type for a property path on a resource
     * @param {string} parameterName The parameter name or name with nested structure e.g A.B.C
     * @param {object} parameters The parameters
     * @return {string} The type to use for the parameter
     * @throws {Error} if the property does not exist or is of an unsupported type
     * @private
     */
    getParameterType(parameterName, parameters) {
        const method = 'getParameterType';
        LOG.entry(method, parameterName);

        // If we have entered a scope, for example a CONTAINS, then we need
        // to prepend the current scope to the property name.
        let actualParameterName = parameterName;
        if (parameters.scopes && parameters.scopes.length) {
            actualParameterName = parameters.scopes.concat(parameterName).join('.');
        }

        const classDeclaration = this.query.getSelect().getResourceClassDeclaration();
        const property = classDeclaration.getNestedProperty(actualParameterName);

        let result = null;

        // enums and relationships are represented as strings
        if (property.isTypeEnum() || property instanceof RelationshipDeclaration) {
            result = 'String';
        } else if (property.isPrimitive()) {
            // primities are returned as-is
            result = property.getType();
        } else {
            // anything else is not supported
            throw new Error('Unsupported property type ' + property.getFullyQualifiedName());
        }

        LOG.exit(method, result);
        return result;
    }
}

module.exports = QueryAnalyzer;
