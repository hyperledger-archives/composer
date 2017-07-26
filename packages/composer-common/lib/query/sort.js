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

/**
 * Defines a sort on a field for an ORDER BY clause
 *
 * @private
 * @class
 * @memberof module:composer-common
 */
class Sort {

    /**
     * Create a Sort from an Abstract Syntax Tree. The AST is the
     * result of parsing.
     *
     * @param {OrderBy} orderBy - the OrderBy for this sort by
     * @param {string} ast - the AST created by the parser
     * @throws {IllegalModelException}
     */
    constructor(orderBy, ast) {
        if(!orderBy || !ast) {
            throw new IllegalModelException('Invalid OrderBy or AST');
        }

        this.ast = ast;
        this.orderBy = orderBy;
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
     * Returns the OrderBy that owns this Sort.
     *
     * @return {OrderBy} the owning OrderBy
     */
    getOrderBy() {
        return this.orderBy;
    }

    /**
     * Process the AST and build the model
     *
     * @throws {IllegalModelException}
     * @private
     */
    process() {
        if(!this.ast.fieldName) {
            throw new IllegalModelException('Invalid AST');
        }else{
            this.propertyPath = this.ast.fieldName.name;
        }

        if(this.ast.direction) {
            this.direction = this.ast.direction;
        } else {
            this.direction = 'ASC';
        }
    }

    /**
     * Semantic validation of the structure of this select.
     *
     * @throws {IllegalModelException}
     * @private
     */
    validate() {
        // check that the property exists
        this.getOrderBy().getSelect().getResourceClassDeclaration().getNestedProperty(this.propertyPath);
    }

    /**
     * Returns the name of the property of the owning resource. This may be an dotted expression
     * to navigate to sub-properties of the owning resource. E.g. x.y.z.
     *
     * @return {string} the navigation property
     */
    getPropertyPath() {
        return this.propertyPath;
    }

    /**
     * Returns the name of the property of the owning resource. This may be an dotted expression
     * to navigate to sub-properties of the owning resource. E.g. x.y.z.
     *
     * @return {string} the navigation property
     */
    getDirection() {
        return this.direction;
    }

}

module.exports = Sort;
