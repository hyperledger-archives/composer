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

const Typed = require('./typed');

/**
 * Resource is an instance that has a type. The type of the resource
 * specifies a set of properites (which themselves have types).
 *
 *
 * Type information in Composer is used to validate the structure of
 * Resource instances and for serialization.
 *
 *
 * Resources are used in Composer to represent Assets, Participants, Transactions and
 * other domain classes that can be serialized for long-term persistent storage.
 *
 * @extends Typed
 * @see See  {@link Resource}
 * @class
 * @memberof module:composer-common
 */
class Concept extends Typed {
    /**
     * This constructor should not be called directly.
     * <p>
     * <strong>Note: Only to be called by framework code. Applications should
     * retrieve instances from {@link Factory}</strong>
     * </p>
     *
     * @param {ModelManager} modelManager - The ModelManager for this instance
     * @param {ClassDeclaration} classDeclaration - The class declaration for this instance.
     * @param {string} ns - The namespace this instance.
     * @param {string} type - The type this instance.
     * @private
     */
    constructor(modelManager, classDeclaration, ns, type) {
        super(modelManager, classDeclaration, ns, type);
    }


    /**
     * Determine if this typed is a concept.
     * @return {boolean} True if this typed is a concept,
     * false if not.
     */
    isConcept() {
        return true;
    }
}

module.exports = Concept;
