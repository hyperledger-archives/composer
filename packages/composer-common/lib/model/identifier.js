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

const ModelUtils = require('../modelutil');

/**
 * All the identifying properties of a resource.
 * @private
 * @class
 * @memberof module:composer-common
 * @property {String} protocol
 * @property {String} namespace
 * @property {String} type
 * @property {String} id
 */
class Identifier {
    /**
     * <strong>Note: only for use by internal framework code.</strong>
     * @param {String} protocol - Protocol.
     * @param {String} namespace - Namespace containing the type.
     * @param {String} type - Short type name.
     * @param {String} id - Instance identifier.
     * @private
     */
    constructor(protocol, namespace, type, id) {
        this.protocol = protocol;
        this.namespace = namespace;
        this.type = type;
        this.id = id;
    }

    /**
     * Parse a URI into an identifier.
     * @param {String} uri - Resource URI.
     * @param {String} [defaultNamespace] - Namespace to use if the URI does not specify one.
     * @param {String} [defaultType] - Type to use if the URI does not specify one.
     * @return {Identifier} - An identifier.
     */
    static fromURI(uri, defaultNamespace, defaultType) {
        // Format: "protocol:qualifiedType#identifier", where "protocol:" and "qualifiedType#" are optional.
        // This pattern should never fail to match.
        const pattern = /^(?:([^:#]+):)?(?:([^#]+)#)?(.*)$/;
        const match = uri.match(pattern);

        const protocol = match[1] || '';
        const qualifiedType = match[2] || '';
        const id = decodeURI(match[3] || '');

        let namespace = defaultNamespace;
        let type = defaultType;
        if (qualifiedType) {
            namespace = ModelUtils.getNamespace(qualifiedType);
            type = ModelUtils.getShortName(qualifiedType);
        }

        return new Identifier(protocol, namespace, type, id);
    }

    /**
     * URI representation of this identifier.
     * @return {String} - A URI.
     */
    toURI() {
        const encodedId = encodeURI(this.id);
        const qualifiedType = ModelUtils.getFullyQualifiedName(this.namespace, this.type);
        return `${this.protocol}:${qualifiedType}#${encodedId}`;
    }

}

module.exports = Identifier;
