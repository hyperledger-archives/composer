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

/** Class representing the definition of a Participant.
 * @extends ClassDeclaration
 * @see See [ClassDeclaration]{@link module:composer-common.ClassDeclaration}
 * @private
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
}

module.exports = ParticipantDeclaration;
