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

const ClassDeclaration = require('./classdeclaration');
// const Field = require('./field');

/** Class representing the definition of an Event.
 * @extends ClassDeclaration
 * @see See [ClassDeclaration]{@link module:composer-common.ClassDeclaration}
 * @private
 * @class
 * @memberof module:composer-common
 */
class EventDeclaration extends ClassDeclaration {
    /**
     * Create an EventDeclaration.
     * @param {ModelFile} modelFile the ModelFile for this class
     * @param {Object} ast - The AST created by the parser
     * @throws {InvalidModelException}
     */
    constructor(modelFile, ast) {
        super(modelFile, ast);
    }

    /**
     * Process the AST and build the model
     *
     * @throws {InvalidModelException}
     * @private
     */
    process() {
        super.process();

        // if(!this.ast.classExtension) {
        //     this.superType = 'Event';
        // }

        console.log(this.superType);

        // we add the timestamp property that all events must have
        // if(this.getProperty('timestamp') === null) {
        //     const ast = {
        //         id : {name: 'timestamp'},
        //         propertyType: {name: 'DateTime'}
        //     };
        //     this.properties.push(new Field(this, ast));
        // }
    }
}

module.exports = EventDeclaration;
