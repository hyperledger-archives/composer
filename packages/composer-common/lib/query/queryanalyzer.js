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
const LOG = Logger.getLog('QueryAnalyzer');

/**
 * The query analyzer visits a query and extracts the names and types of all parameters
 * @protected
 */
class QueryAnalyzer {

    /**
     * Extract the names and types of query parameters
     * @param {QueryManager} query The query to process.
     * @return {object[]} The names and types of the query parameters
     */
    analyze(query) {
        const method = 'analyze';
        LOG.entry(method, query);
        const result = query.accept(this, {});
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
        const arrayCombinationOperators = [ 'AND', 'OR' ];
        const conditionOperators = [ '<', '<=', '>', '>=', '==', '!=' ];
        let result;
        if (arrayCombinationOperators.indexOf(ast.operator) !== -1) {
            result = this.visitArrayCombinationOperator(ast, parameters);
        } else if (conditionOperators.indexOf(ast.operator) !== -1) {
            result = this.visitConditionOperator(ast, parameters);
        } else {
            throw new Error('The query compiler does not support this binary expression');
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
        const lhs = this.visit(ast.left, parameters);
        console.log('Result of lhs: ' + lhs );
        result.concat(lhs);

        const rhs = this.visit(ast.right, parameters);
        console.log('Result of rhs: ' + rhs );
        result = result.concat(rhs);

        console.log('***** result of conditional operator ' + result);

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
        const result = [];

        console.log('**** visiting ' + JSON.stringify(ast));

        // Check to see if this is a parameter reference.
        const parameterMatch = ast.name.match(/^_\$(.+)/);
        if (parameterMatch) {
            const parameterName = parameterMatch[1];
            // TODO - figure out the type of the parameter by looking
            // at the type of the LHS or RHS if there is one
            result.push({name: parameterName, type : 'String'});
        }

        console.log('**** visitIdentifier result ' + result);

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
        const result = [];
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
        const result = [];

        const property = this.visit(ast.property, parameters);
        result.concat(property);

        const object = this.visit(ast.object, parameters);

        result.concat(object);
        // const selector = `${object}.${property}`;
        LOG.exit(method, result);
        return result;
    }
}

module.exports = QueryAnalyzer;
