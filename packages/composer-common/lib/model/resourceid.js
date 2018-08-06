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

const URIJS = require('urijs');

const ModelUtils = require('../modelutil');

const RESOURCE_SCHEME = 'resource';

/**
 * All the identifying properties of a resource.
 * @private
 * @class
 * @memberof module:composer-common
 * @property {String} namespace
 * @property {String} type
 * @property {String} id
 */
class ResourceId {
    /**
     * <strong>Note: only for use by internal framework code.</strong>
     * @param {String} namespace - Namespace containing the type.
     * @param {String} type - Short type name.
     * @param {String} id - Instance identifier.
     * @private
     */
    constructor(namespace, type, id) {
        if (!namespace) {
            throw new Error('Missing namespace');
        }
        if (!type) {
            throw new Error('Missing type');
        }
        if (!id) {
            throw new Error('Missing id');
        }

        this.namespace = namespace;
        this.type = type;
        this.id = id;
    }

    /**
     * Parse a URI into an identifier.
     * <p>
     * Three formats are allowable:
     * <ol>
     *   <li>Valid resource URI argument: <em>resource:qualifiedTypeName#ID</em></li>
     *   <li>Valid resource URI argument with missing URI scheme: <em>qualifiedTypeName#ID</em></li>
     *   <li>URI argument containing only an ID, with legacy namespace and type arguments supplied.</li>
     * </ol>
     * @param {String} uri - Resource URI.
     * @param {String} [legacyNamespace] - Namespace to use for legacy resource identifiers.
     * @param {String} [legacyType] - Type to use for legacy resource identifiers.
     * @return {Identifier} - An identifier.
     * @throws {Error} - On an invalid resource URI.
     */
    static fromURI(uri, legacyNamespace, legacyType) {
        let uriComponents;
        try {
            uriComponents = URIJS.parse(uri);
        } catch (err){
            throw new Error('Invalid URI: ' + uri);
        }

        const scheme = uriComponents.protocol;
        // Accept legacy identifiers with missing URI scheme as valid
        if (scheme && scheme !== RESOURCE_SCHEME) {
            throw new Error('Invalid URI scheme: ' + uri);
        }
        if (uriComponents.username || uriComponents.password || uriComponents.port || uriComponents.query) {
            throw new Error('Invalid resource URI format: ' + uri);
        }

        let namespace, type;
        let id = uriComponents.fragment;
        if (!id) {
            // Legacy format where the whole path is the ID
            namespace = legacyNamespace;
            type = legacyType;
            id = uriComponents.path;
        } else {
            const qualifiedType = uriComponents.path;
            namespace = ModelUtils.getNamespace(qualifiedType);
            type = ModelUtils.getShortName(qualifiedType);
        }

        return new ResourceId(namespace, type, decodeURIComponent(id));
    }

    /**
     * URI representation of this identifier.
     * @return {String} A URI.
     */
    toURI() {
        const qualifiedType = ModelUtils.getFullyQualifiedName(this.namespace, this.type);
        return RESOURCE_SCHEME + ':' +  qualifiedType + '#' + encodeURI(this.id);
    }

}

module.exports = ResourceId;
