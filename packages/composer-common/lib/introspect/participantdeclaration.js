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

/** Class representing the definition of a Participant.
 * @extends ClassDeclaration
 * @see See  {@link ClassDeclaration}
 *
 * @class
 * @memberof module:composer-common
 */
class ParticipantDeclaration extends ClassDeclaration {
    /**
     * Create an ParticipantDeclaration.
     * @param {ModelFile} modelFile the ModelFile for this class
     * @param {Object} ast - The AST created by the parser
     * @throws {IllegalModelException}
     */
    constructor(modelFile, ast) {
        super(modelFile, ast);
    }

    /**
     * Returns true if this class can be pointed to by a relationship
     *
     * @return {boolean} true if the class may be pointed to by a relationship
     */
    isRelationshipTarget() {
        return true;
    }

    /**
     * Returns the base system type for Participants from the system namespace
     *
     * @return {string} the short name of the base system type
     */
    getSystemType() {
        return 'Participant';
    }

    /**
     * Semantic validation of the structure of this participant. Subclasses should
     * override this method to impose additional semantic constraints on the
     * contents/relations of fields.
     *
     * @throws {IllegalModelException}
     * @private
     */
    validate() {
        super.validate();

        if(!this.isSystemType() && this.getName() === 'Participant') {
            throw new IllegalModelException('Participant is a reserved type name.', this.modelFile, this.ast.location);
        }
    }
}

module.exports = ParticipantDeclaration;
