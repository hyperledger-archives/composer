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

const Limit = require('composer-common').Limit;
const Logger = require('composer-common').Logger;
const OrderBy = require('composer-common').OrderBy;
const Query = require('composer-common').Query;
const Select = require('composer-common').Select;
const Skip = require('composer-common').Skip;
const Where = require('composer-common').Where;

const LOG = Logger.getLog('IndexCompiler');

/**
 * A query compiler compiles all queries in a query manager into a compiled
 * query bundle that can easily be called by the runtime.
 * @protected
 */
class IndexCompiler {

    /**
     * Index the supplied query
     * @param {Query} query The query to index.
     * @return {String} The compiled query index.
     */
    compile(query) {
        const method = 'compile';
        LOG.entry(method, query);
        const result = JSON.stringify(this.visit(query));
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
    visitQuery(query) {
        const method = 'visitQuery';
        LOG.entry(method, query);

        // Process the select statement, which will return a Mango query.
        const select = query.getSelect();
        const result = select.accept(this);

        result.name = query.name;
        result.ddoc = query.name + 'Doc';
        result.type = 'json';

        LOG.exit(method, result);
        return result;
    }

    /**
     * Extract the identifier name from the AST
     * @param {Object} part - the AST
     * @returns {String} - the identifier name
     * @private
     */
    getFieldName(part) {
        const side = this.visit(part);
        return side;
    }

    /**
     * Visitor design pattern; handle a select statement.
     * @param {Select} select The select statement being visited.
     * @param {Object} parameters The parameters.
     * @return {Object} The result of visiting, or null.
     * @private
     */
    visitSelect(select) {
        const method = 'visitSelect';
        LOG.entry(method, select);

        const query = {
            index: {
                fields: ['\\$class', '\\$registryType', '\\$registryId']
            }
        };

        let direction = null;

        // processAdditions takes an array of fields to index and insets '.data'
        // to the start of each field name.  It also de-duplicates entries
        // by temporarily adding them to an object (map) to de-dup on key name
        const processAdditions = (additions, accumulator) => {
            // add '.data' to start of each field name
            additions.forEach((addition) => {
                if(typeof addition === 'string' && addition.indexOf('_$') !== 0) {
                    accumulator[addition] = addition;
                } else if(Array.isArray(addition)) {
                    processAdditions(addition, accumulator);
                } else if(typeof addition === 'object' && addition !== null) {
                    const key = Object.keys(addition)[0];
                    let obj = {};
                    obj[key] = addition[key];
                    if(direction === null) {
                        // set the direction for all fields
                        direction = addition[key];
                    }
                    accumulator[key] = obj;
                }
            });
        };

        let accumulator = {};

        // Handle the where clause, if it exists.
        const where = select.getWhere();
        if (where) {
            let additions = where.accept(this);
            processAdditions(additions, accumulator);
        }

        // Handle the order by clause, if it exists.
        const orderBy = select.getOrderBy();
        if (orderBy) {
            let additions = orderBy.accept(this);
            processAdditions(additions, accumulator);
        }

        // Handle the limit clause, if it exists. Note that the limit
        // clause can reference a parameter.
        const limit = select.getLimit();
        if (limit) {
            const additions = limit.accept(this);
            processAdditions(additions, accumulator);
        }

        // Handle the skip clause, if it exists. Note that the skip
        // clause can reference a parameter.
        const skip = select.getSkip();
        if (skip) {
            const additions = skip.accept(this);
            processAdditions(additions, accumulator);
        }

        query.index.fields = query.index.fields.concat(Object.values(accumulator));

        if(direction === 'desc') {
            // need to reverse the order of all the fields that don't otherwise care
            query.index.fields = query.index.fields.map(field => {
                if(typeof field === 'string') {
                    const obj = {};
                    obj[field] = direction;
                    return obj;
                }
                return field;
            });
        }

        LOG.exit(method, JSON.stringify(query));
        return query;
    }

    /**
     * Visitor design pattern; handle a where statement.
     * @param {Where} where The where statement being visited.
     * @param {Object} parameters The parameters.
     * @return {Object} The result of visiting, or null.
     * @private
     */
    visitWhere(where) {
        const method = 'visitWhere';
        LOG.entry(method, where);

        // Simply visit the AST, which will generate a selector.
        // The root of the AST is probably a binary expression.
        const result = this.visit(where.getAST());

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
    visitOrderBy(orderBy) {
        const method = 'visitOrderBy';
        LOG.entry(method, orderBy);

        // Iterate over the sort criteria.
        const result = orderBy.getSortCriteria().map((sort) => {
            const temp = {};
            temp[sort.getPropertyPath()] = sort.getDirection().toLowerCase();
            return temp;
        });

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
    visitLimit(limit) {
        const method = 'visitLimit';
        LOG.entry(method, limit);

        const result = [];

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
    visitSkip(skip) {
        const method = 'visitSkip';
        LOG.entry(method, skip);

        const result = [];

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
    visitBinaryExpression(ast) {
        const method = 'visitBinaryExpression';
        LOG.entry(method, ast);

        // Binary expressions are handled differently in Mango based on the type,
        // so figure out the type and handle it appropriately.
        const arrayCombinationOperators = [ 'AND', 'OR' ];
        const conditionOperators = [ '<', '<=', '>', '>=', '==', '!=' ];
        let result;
        if (arrayCombinationOperators.indexOf(ast.operator) !== -1) {
            result = this.visitArrayCombinationOperator(ast);

        } else if (ast.operator === 'CONTAINS') {
            result = this.visitContainsOperator(ast);
        } else if (conditionOperators.indexOf(ast.operator) !== -1) {
            result = this.visitConditionOperator(ast);
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
    visitArrayCombinationOperator(ast) {
        const method = 'visitArrayCombinationOperator';
        LOG.entry(method, ast);

        const left = this.getFieldName(ast.left);
        const right = this.getFieldName(ast.right);

        const result = [left, right];

        LOG.exit(method, result);
        return result;
    }

    /**
     * Visitor design pattern; handle an contains operator.
     * @param {Object} ast The abstract syntax tree being visited.
     * @param {Object} parameters The parameters.
     * @return {Object} The result of visiting, or null.
     * @private
     */
    visitContainsOperator(ast) {
        const method = 'visitContainsOperator';
        LOG.entry(method, ast);

        const left = this.getFieldName(ast.left);
        const right = this.getFieldName(ast.right);

        const result = [left, right];

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
    visitConditionOperator(ast) {
        const method = 'visitConditionOperator';
        LOG.entry(method, ast);

        const left = this.getFieldName(ast.left);
        const right = this.getFieldName(ast.right);

        const result = [left, right];

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
    visitIdentifier(ast) {
        const method = 'visitIdentifier';
        LOG.entry(method, ast);

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
    visitLiteral(ast) {
        const method = 'visitLiteral';
        LOG.entry(method, ast);

        const result = null;

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
    visitArrayExpression(ast) {
        const method = 'visitArrayExpression';
        LOG.entry(method, ast);
        const selector = ast.elements.map((element) => {
            return this.visit(element);
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
    visitMemberExpression(ast) {
        const method = 'visitMemberExpression';
        LOG.entry(method, ast);
        const property = this.visit(ast.property);
        const object = this.visit(ast.object);
        const selector = `${object}.${property}`;
        LOG.exit(method, selector);
        return selector;
    }

}

module.exports = IndexCompiler;
