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
const IllegalModelException = require('./illegalmodelexception');
const ModelUtil = require('../modelutil');

/** Class representing the definition of an Event.
 * @extends ClassDeclaration
 * @see See  {@link ClassDeclaration}
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
     * Returns the base system type for Events from the system namespace
     *
     * @return {string} the short name of the base system type
     */
    getSystemType() {
        return 'Event';
    }

     /**
     * Semantic validation of the structure of this event. Subclasses should
     * override this method to impose additional semantic constraints on the
     * contents/relations of fields.
     *
     * @throws {IllegalModelException}
     * @private
     */
    validate() {
        if(!this.isSystemType() && this.getName() === 'Event') {
            throw new IllegalModelException('Event is a reserved type name.', this.modelFile, this.ast.location);
        }

        let systemTypeDeclared = true;

        // If using models without importing system models
        try {
            this.getModelFile().getType(ModelUtil.getSystemNamespace() + '.' + this.getSystemType());
        } catch (e) {
            systemTypeDeclared = false;
        }

        if (!this.isSystemType() && this.idField && systemTypeDeclared) {
            throw new IllegalModelException('Event should not specify an identifying field.', this.modelFile, this.ast.location);
        }

        // do generic validation after specific validation
        super.validate();
    }

     /**
     * Returns true if this class is the definition of an event
     *
     * @return {boolean} true if the class is an event
     */
    isEvent() {
        return true;
    }
}

module.exports = EventDeclaration;
