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

const AssetDeclaration = require('composer-common').AssetDeclaration;
const CompiledQueryBundle = require('./compiledquerybundle');
const createHash = require('sha.js');
const Limit = require('composer-common').Limit;
const Logger = require('composer-common').Logger;
const OrderBy = require('composer-common').OrderBy;
const ParticipantDeclaration = require('composer-common').ParticipantDeclaration;
const Query = require('composer-common').Query;
const QueryFile = require('composer-common').QueryFile;
const QueryManager = require('composer-common').QueryManager;
const Select = require('composer-common').Select;
const Skip = require('composer-common').Skip;
const TransactionDeclaration = require('composer-common').TransactionDeclaration;
const Where = require('composer-common').Where;

const LOG = Logger.getLog('QueryCompiler');

/**
 * A query compiler compiles all queries in a query manager into a compiled
 * query bundle that can easily be called by the runtime.
 * @protected
 */
class QueryCompiler {

    /**
     * Compile all the queries in the specified query manager into a compiled
     * query bundle for use by the runtime.
     * @param {QueryManager} queryManager The query manager to process.
     * @return {CompiledQueryBundle} The compiled query bundle.
     */
    compile(queryManager) {
        const method = 'compile';
        LOG.entry(method, queryManager);
        const compiledQueries = queryManager.accept(this, {});
        const result = new CompiledQueryBundle(this, queryManager, compiledQueries);
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
        if (thing instanceof QueryManager) {
            result = this.visitQueryManager(thing, parameters);
        } else if (thing instanceof QueryFile) {
            result = this.visitQueryFile(thing, parameters);
        } else if (thing instanceof Query) {
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
     * Visitor design pattern; handle a query manager by visiting all of the query files.
     * @param {QueryManager} queryManager The query manager being visited.
     * @param {Object} parameters The parameters.
     * @return {Object} The result of visiting, or null.
     * @private
     */
    visitQueryManager(queryManager, parameters) {
        const method = 'visitQueryManager';
        LOG.entry(method, queryManager, parameters);

        // Compile all of the query files in this query manager.
        let compiledQueries = [];
        const queryFile = queryManager.getQueryFile();
        if (queryFile) {
            compiledQueries = queryManager.getQueryFile().accept(this, parameters);
        }

        LOG.exit(method, compiledQueries);
        return compiledQueries;
    }

    /**
     * Visitor design pattern; handle a query file by visiting all of the queries.
     * @param {QueryFile} queryFile The query file being visited.
     * @param {Object} parameters The parameters.
     * @return {Object} The result of visiting, or null.
     * @private
     */
    visitQueryFile(queryFile, parameters) {
        const method = 'visitQueryFile';
        LOG.entry(method, queryFile, parameters);

        // Compile all of the queries in this query file.
        const compiledQueries = queryFile.getQueries().map((query) => {
            return query.accept(this, parameters);
        });

        LOG.exit(method, compiledQueries);
        return compiledQueries;
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
        const compiledQuery = select.accept(this, parameters);

        // If there are no required parameters, then we can use a trivial generator function.
        let compiledQueryGenerator;
        if (requiredParameters.length === 0) {
            // Serialize the compiled query string and always return that.
            compiledQueryGenerator = this.buildTrivialCompiledQueryGenerator(compiledQuery);

        // Otherwise we have to build a more complex generator function.
        } else {

            // No short cuts here!
            compiledQueryGenerator = this.buildComplexCompiledQueryGenerator(compiledQuery, requiredParameters, parametersToUse);

        }

        // Generate a hash for the query.
        const hash = this.generateQueryHash(query);

        // Generate a result object containing all the data.
        const result = {
            name: query.getName(),
            text: select.getText(),
            hash: hash,
            generator: compiledQueryGenerator,
        };

        LOG.exit(method, result);
        return result;
    }

    /**
     * Build a trivial (no parameters) compiled query generator.
     * @param {Object} compiledQuery The compiled query.
     * @return {Function} The compiled query generator.
     */
    buildTrivialCompiledQueryGenerator(compiledQuery) {
        const compiledQueryString = JSON.stringify(compiledQuery);
        return (inputParameters) => {
            if (Object.keys(inputParameters).length !== 0) {
                throw new Error('No parameters should be specified for this query');
            }
            return compiledQueryString;
        };
    }

    /**
     * Build a complex (one or more parameters) compiled query generator.
     * @param {Object} compiledQuery The compiled query.
     * @param {string[]} requiredParameters The required parameters.
     * @param {Object} parametersToUse The parameters to use.
     * @return {Function} The compiled query generator.
     */
    buildComplexCompiledQueryGenerator(compiledQuery, requiredParameters, parametersToUse) {
        return (inputParameters) => {

            // Check for all required parameters.
            requiredParameters.forEach((requiredParameter) => {
                if (inputParameters[requiredParameter] === undefined) {
                    throw new Error('Required parameter ' + requiredParameter + ' has not been specified');
                }
            });

            // Check for any extraneous parameters.
            Object.keys(inputParameters).forEach((inputParameter) => {
                if (requiredParameters.indexOf(inputParameter) === -1) {
                    throw new Error('Invalid or extraneous parameter ' + inputParameter + ' has been specified');
                }
            });

            // Delete all parameters from the last execution.
            Object.keys(parametersToUse).forEach((parameterToUse) => {
                delete parametersToUse[parameterToUse];
            });

            // Assign the input parameters and serialize the compiled query string.
            // Note that this will fire all the functions which look up parameters
            // from the parameters to use object.
            Object.assign(parametersToUse, inputParameters);

            return JSON.stringify(compiledQuery);

        };
    }

    /**
     * Generate a unique hash for the query.
     * @param {Query} query The query.
     * @return {string} A unique hash for the query.
     */
    generateQueryHash(query) {
        const text = query.getSelect().getText();
        const sha256 = createHash('sha256');
        return sha256.update(text, 'utf8').digest('hex');
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

        // Handle the resource clause, which will always exist.
        const resource = select.getResource();
        const query = {
            selector: {}
        };

        // The \\ escape for $class is required to avoid CouchDB treating it as an operator.
        query.selector['\\$class'] = resource;

        // Look up the type for this resource.
        const modelManager = select.getQuery().getQueryFile().getModelManager();
        const classDeclaration = modelManager.getType(resource);
        if (classDeclaration instanceof AssetDeclaration) {
            query.selector['\\$registryType'] = 'Asset';
        } else if (classDeclaration instanceof ParticipantDeclaration) {
            query.selector['\\$registryType'] = 'Participant';
        } else if (classDeclaration instanceof TransactionDeclaration) {
            query.selector['\\$registryType'] = 'Transaction';
        } else {
            throw new Error('The query compiler does not support resources of this type');
        }

        // Handle the from clause, if it exists.
        const registry = select.getRegistry();
        if (registry) {
            query.selector['\\$registryId'] = registry;
        } else {
            query.selector['\\$registryId'] = resource;
        }

        // Handle the where clause, if it exists.
        const where = select.getWhere();
        if (where) {

            const queryAdditions = where.accept(this, parameters);
            Object.assign(query.selector, queryAdditions.selector);
        }

        // Handle the order by clause, if it exists.
        const orderBy = select.getOrderBy();
        if (orderBy) {
            const queryAdditions = orderBy.accept(this, parameters);
            Object.assign(query, queryAdditions);
        }

        // Handle the limit clause, if it exists. Note that the limit
        // clause can reference a parameter.
        const limit = select.getLimit();
        if (limit) {
            const queryAdditions = limit.accept(this, parameters);
            Object.keys(queryAdditions).forEach((key) => {
                const prop = Object.getOwnPropertyDescriptor(queryAdditions, key);
                Object.defineProperty(query, key, prop);
            });
        }

        // Handle the skip clause, if it exists. Note that the skip
        // clause can reference a parameter.
        const skip = select.getSkip();
        if (skip) {
            const queryAdditions = skip.accept(this, parameters);
            Object.keys(queryAdditions).forEach((key) => {
                const prop = Object.getOwnPropertyDescriptor(queryAdditions, key);
                Object.defineProperty(query, key, prop);
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
    visitWhere(where, parameters) {
        const method = 'visitWhere';
        LOG.entry(method, where, parameters);


        // Simply visit the AST, which will generate a selector.
        // The root of the AST is probably a binary expression.
        const selector = this.visit(where.getAST(), parameters);
        const result = {
            selector
        };

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

        // Iterate over the sort criteria.

        let fields = ['\\$class','\\$registryType','\\$registryId'];
        let direction = null;
        orderBy.getSortCriteria().forEach((sort) => {
            if(direction === null) {
                direction = sort.getDirection().toLowerCase();
            } else if(direction !== sort.getDirection().toLowerCase()) {
                throw new Error('ORDER BY currently only supports a single direction for all fields.');
            }
            fields.push(sort.getPropertyPath());
        });

        const result = {
            sort: fields.map(field => {
                const term = {};
                term[field] = direction;
                return term;
            })
        };

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
        const limitValue = this.visit(limit.getAST(), parameters);

        // Define a limit property on the query; if the limit value is a parameter,
        // then define a getter to read the current parameter setting.
        const property = {
            enumerable: true,
            configurable: true
        };
        if (typeof limitValue === 'function') {
            property.get = limitValue;
        } else {
            property.value = limitValue;
        }
        const result = {};
        Object.defineProperty(result, 'limit', property);

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
        const skipValue = this.visit(skip.getAST(), parameters);

        // Define a skip property on the query; if the skip value is a parameter,
        // then define a getter to read the current parameter setting.
        const property = {
            enumerable: true,
            configurable: true
        };
        if (typeof skipValue === 'function') {
            property.get = skipValue;
        } else {
            property.value = skipValue;
        }
        const result = {};
        Object.defineProperty(result, 'skip', property);

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

        } else if (ast.operator === 'CONTAINS') {
            result = this.visitContainsOperator(ast, parameters);
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

        // Map the input operator to the Mango operator.
        const validOperators = {
            AND: '$and',
            OR: '$or'
        };
        const operator = validOperators[ast.operator];
        if (!operator) {
            throw new Error('The query compiler does not support this operator');
        }

        // Visit the left and right sides of the expression.
        let left = this.visit(ast.left, parameters);
        let right = this.visit(ast.right, parameters);

        const eliminateAND = function (lhs, rhs) {
            const combined = {};
            if(typeof lhs === 'object' && typeof rhs === 'object' && !(lhs.hasOwnProperty('$or') && rhs.hasOwnProperty('$or'))) {
                // put all the selectors in the lhs in the combined selector
                const leftProperties = Object.getOwnPropertyDescriptors(lhs);
                const rightProperties = Object.getOwnPropertyDescriptors(rhs);
                for (const key in leftProperties) {
                    Object.defineProperty(combined, key, leftProperties[key]);
                }
                // then merge the rhs in
                for (const key in rightProperties) {
                    if (combined.hasOwnProperty(key)) {
                        // already exists - merge
                        const merged = eliminateAND(combined[key], rhs[key]);
                        delete combined[key];
                        combined[key] = merged;
                    } else {
                        Object.defineProperty(combined, key, rightProperties[key]);
                    }
                }
            } else {
                // can't merge non-object, just return the $and
                combined.$and = [lhs, rhs];
            }
            return combined;
        };

        // Build the Mango selector for this operator.
        let result = {};
        if(operator === '$and') {
            result = eliminateAND(left, right);
        } else {
            result[operator] = [
                left,
                right
            ];
        }

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
    visitContainsOperator(ast, parameters) {
        const method = 'visitContainsOperator';
        LOG.entry(method, ast, parameters);

        // Visit the left and right sides of the expression.
        let left = this.visit(ast.left, parameters);
        let right = this.visit(ast.right, parameters);

        // Grab the left hand side of this expression.
        const leftIsIdentifier = (ast.left.type === 'Identifier' && typeof left !== 'function');
        const leftIsMemberExpression = (ast.left.type === 'MemberExpression');
        const leftIsVariable = leftIsIdentifier || leftIsMemberExpression;

        // Grab the right hand side of this expression.
        const rightIsIdentifier = (ast.right.type === 'Identifier' && typeof right !== 'function');
        const rightIsMemberExpression = (ast.right.type === 'MemberExpression');
        const rightIsVariable = rightIsIdentifier || rightIsMemberExpression;

        // Ensure the arguments are valid.
        if (leftIsVariable) {
            // This is OK.
        } else if (rightIsVariable) {
            // This is OK, but swap the arguments.
            const temp = left;
            left = right;
            right = temp;
        } else {
            throw new Error(`The operator ${ast.operator} requires a property name`);
        }

        // Check to see if we have a selector, in which case this is an $elemMatch.
        let operator = '$all';
        if (!Array.isArray(right) && typeof right === 'object') {
            operator = '$elemMatch';
        }

        // We have to coerce the right hand side into an array for an $all.
        if (operator === '$all' && !Array.isArray(right)) {
            if (typeof right === 'function') {
                const originalRight = right;
                right = () => {
                    const value = originalRight();
                    if (Array.isArray(value)) {
                        return value;
                    } else {
                        return [ value ];
                    }
                };
            } else {
                right = [ right ];
            }
        }

        // Build the Mango selector for this operator.
        const result = {};
        result[left] = {};
        const property = {
            enumerable: true,
            configurable: true
        };
        if (typeof right === 'function') {
            property.get = right;
        } else {
            property.value = right;
        }
        Object.defineProperty(result[left], operator, property);

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

        // Map the input operator to the Mango operator.
        const validOperators = {
            '<': '$lt',
            '<=': '$lte',
            '>': '$gt',
            '>=': '$gte',
            '==': '$eq',
            '!=': '$ne'
        };
        let operator = validOperators[ast.operator];
        if (!operator) {
            throw new Error('The query compiler does not support this operator');
        }

        // Grab the left hand side of this expression.
        let left = this.visit(ast.left, parameters);
        const leftIsIdentifier = (ast.left.type === 'Identifier' && typeof left !== 'function');
        const leftIsMemberExpression = (ast.left.type === 'MemberExpression');
        const leftIsVariable = leftIsIdentifier || leftIsMemberExpression;
        const leftIsLiteral = (ast.left.type === 'Literal' || typeof left === 'function');

        // Grab the right hand side of this expression.
        let right = this.visit(ast.right, parameters);
        const rightIsIdentifier = (ast.right.type === 'Identifier' && typeof right !== 'function');
        const rightIsMemberExpression = (ast.right.type === 'MemberExpression');
        const rightIsVariable = rightIsIdentifier || rightIsMemberExpression;
        const rightIsLiteral = (ast.right.type === 'Literal' || typeof right === 'function');

        // Check for invalid left and right expressions.
        if (leftIsLiteral === rightIsLiteral || leftIsVariable === rightIsVariable) {
            // Either two literals or two identifiers.
            throw new Error('The query compiler cannot compile condition operators that do not have an identifier and a literal');
        }

        // Check for a conditional with a literal on the left, and swap the operands.
        if (leftIsLiteral) {

            // Since we are going to swap the operands around, we also need to change the operator.
            const mirrorOperators = {
                '<': '$gt',   // a < b becomes b > a
                '<=': '$gte', // a <= b becomes b >= a
                '>': '$lt',   // a > b becomes b < a
                '>=': '$lte', // a >= b becomes b <= a
                '==': '$eq',  // no change
                '!=': '$ne'   // no change
            };
            operator = mirrorOperators[ast.operator];

            // Swap the operands around.
            const temp = left;
            left = right;
            right = temp;

        }

        // Validate the right hand side; it can be any primitive value.
        if (right !== null && typeof right === 'object') {
            throw new Error('The query compiler cannot compile a condition with a complex value literal');
        }

        // Build the Mango selector for this operator.
        const result = {};
        result[left] = {};
        const property = {
            enumerable: true,
            configurable: true
        };
        if (typeof right === 'function') {
            property.get = right;
        } else {
            property.value = right;
        }
        Object.defineProperty(result[left], operator, property);

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
            parameters.requiredParameters.push(parameterName);
            const parametersToUse = parameters.parametersToUse;
            const selector = () => {
                return parametersToUse[parameterName];
            };
            LOG.exit(method, selector);
            return selector;
        }

        // Otherwise it's a property name.
        // TODO: We should validate that it is a property name!
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
        const selector = ast.value;
        LOG.exit(method, selector);
        return selector;
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
            const result = this.visit(element, parameters);
            return result;
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
        const property = this.visit(ast.property, parameters);
        const object = this.visit(ast.object, parameters);
        const selector = `${object}.${property}`;
        LOG.exit(method, selector);
        return selector;
    }

}

module.exports = QueryCompiler;
