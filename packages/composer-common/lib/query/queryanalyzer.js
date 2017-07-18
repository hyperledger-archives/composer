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
     * Create an Query from an Abstract Syntax Tree. The AST is the
     * result of parsing.
     *
     * @param {Query} query - the composer query for process
     * @throws {IllegalModelException}
     */
    constructor(query) {
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
        console.log('xxxxx visit parameters = ', parameters);
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

        console.log('visiting ' + method + JSON.stringify(select.ast) + 'parameters = ' + parameters);
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
        console.log('visiting ' + method + JSON.stringify(where.ast));

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
        const result = [];
        const value = this.visit(limit.getAST(), parameters);
        const rparams = parameters.requiredParameters;
        if(rparams !== null && rparams.length === 1){
            result.push({name: rparams[0], type: 'Integer'});
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
        const result = [];
        let value = this.visit(skip.getAST(), parameters);
        const rparams = parameters.requiredParameters;
        if(rparams !== null && rparams.length === 1){
            result.push({name: rparams[0], type: 'Integer'});
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

           // Grab the right hand side of this expression.
        const rhs = this.visit(ast.right, parameters);
        const rparams = parameters.requiredParameters;
        const lhs = this.visit(ast.left, parameters);


        if( rparams !== null && rparams.length === 1){
            //find the variable's type from the rhs
            const paramType = this.getParameterType(lhs);
            result.push({name: rparams[0], type: paramType});
            result.concat(rhs);
        }

        // result.concat(lhs);
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

        // clear the parameters for each indentifier
        if( parameters !== null ){
            parameters.requiredParameters= [];
        }
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
     * @param {string} parameterNames The parameter name or name with nested structure e.g A.B.C
     * @return {string} The result of the parameter type or null
     * @private
     */
    getParameterType(parameterName) {
        const method = 'getParameterType';
        LOG.entry(method, parameterName);

     // The grammar ensures that the resource property is set.
        const  modelManager = this.query.getQueryFile().getModelManager();
        const resource = this.query.getSelect().getResource();

        let result = null;
        if(parameterName === null || parameterName === undefined ) {return result;}

        const parameterNames = parameterName.split('.');

        if(parameterNames === null || parameterNames.length === 0){
            throw new Error('Can only find a valid property type.');
        }

        // checks the resource type exists
        let classDeclaration = modelManager.getType(resource);

        // check that it is not an enum or concept
        if(/*classDeclaration.isConcept() ||*/classDeclaration.isEnum()) {
            throw new Error('Can only select assets, participants and transactions.');
        }

        for(let n=0; n<parameterNames.length; n++){
            const property = classDeclaration.getProperty(parameterNames[n]);

            if( property !== null ){
                if (property.isTypeEnum() || property.isPrimitive()) {
                    result = property.getType();
                }else{
                    const resource = property.getFullyQualifiedTypeName();
                    classDeclaration = modelManager.getType(resource);
                    property.validate(classDeclaration);
                }
            }
        }
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
        console.log('visiting ' + method + JSON.stringify(ast));
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
        const property = this.visit(ast.property, parameters);
        const object = this.visit(ast.object, parameters);
        const selector = `${object}.${property}`;
        LOG.exit(method, selector);
        return selector;
    }
}

module.exports = QueryAnalyzer;
