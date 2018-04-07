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

const Logger = require('composer-common').Logger;

const LOG = Logger.getLog('Serializer');

/**
 * Do not attempt to create an instance of this class.<br>
 * You must use the {@link runtime-api#getSerializer getSerializer}
 * method instead.
 *
 * @class Serializer
 * @summary A serializer serializes instances of assets, participants, transactions,
 * and relationships to and from a JSON serialization format.
 * @memberof module:composer-runtime
 * @public
 */
class Serializer {

    /**
     * Constructor.
     * @param {Serializer} serializer The serializer to use.
     * @private
     */
    constructor(serializer) {
        const method = 'constructor';
        LOG.entry(method, serializer);

        /**
         * Convert a {@link common-Resource} to a JavaScript object suitable for long-term
         * peristent storage.
         * @example
         * // Get the serializer.
         * var serializer = getSerializer();
         * // Serialize a vehicle.
         * var json = serializer.toJSON(vehicle);
         * @public
         * @method module:composer-runtime.Serializer#toJSON
         * @param {Resource} resource The resource instance to convert to JSON.
         * @param {Object} [options] The optional serialization options.
         * @param {boolean} [options.validate] Validate the structure of the resource
         * with its model prior to serialization, true by default.
         * @param {boolean} [options.convertResourcesToRelationships] Convert resources that
         * are specified for relationship fields into relationships, false by default.
         * @param {boolean} [options.permitResourcesForRelationships] Permit resources in the
         * place of relationships (serializing them as resources), false by default.
         * @param {boolean} [options.deduplicateResources] - Generate $id for resources and
         * if a resources appears multiple times in the object graph only the first instance is
         * serialized in full, subsequent instances are replaced with a reference to the $id
         * @return {Object} The JavaScript object that represents the resource
         * @throws {Error} If the specified resource is not an instance of
         * {@link Resource} or if it fails validation during serialization.
         */
        this.toJSON = function toJSON(resource, options = {}) {
            options = Object.assign({}, { validate: true, convertResourcesToRelationships: false, permitResourcesForRelationships: false, deduplicateResources: false }, options);
            return serializer.toJSON(resource, options);
        };

        /**
         * Create a {@link common-Resource} from a JavaScript object representation.
         * The JavaScript object should have been created by calling the
         * {@link runtime-Serializer#toJSON toJSON} api
         * @example
         * // Get the serializer.
         * var serializer = getSerializer();
         * // Serialize a vehicle.
         * var vehicle = serializer.fromJSON(json);
         * @public
         * @method module:composer-runtime.Serializer#fromJSON
         * @param {Object} json The JavaScript object for the resource.
         * @param {Object} [options] The optional serialization options.
         * @param {boolean} [options.acceptResourcesForRelationships] Handle JSON objects
         * in the place of strings for relationships, false by default.
         * @param {boolean} [options.validate] Validate the structure of the resource
         * with its model prior to serialization, true by default.
         * @return {Resource} The resource.
         * @throws {Error} If the specified resource is not an instance of
         * {@link Resource} or if it fails validation during serialization.
         */
        this.fromJSON = function fromJSON(json, options = {}) {
            options = Object.assign({}, { acceptResourcesForRelationships: false, validate: true }, options);
            return serializer.fromJSON(json, options);
        };

        Object.freeze(this);
        LOG.exit(method);
    }

}

module.exports = Serializer;