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

const ConnectionManager = require('composer-common').ConnectionManager;
const createHash = require('sha.js');
const WebConnection = require('./webconnection');
const WebDataService = require('composer-runtime-web').WebDataService;
const uuid = require('uuid');

// The issuer for all identities.
const DEFAULT_ISSUER = createHash('sha256').update('org1').digest('hex');

/**
 * Base class representing a connection manager that establishes and manages
 * connections to one or more business networks.
 * @protected
 * @abstract
 */
class WebConnectionManager extends ConnectionManager {

    /**
     * Creates a new WebConnectionManager
     * @param {ConnectionProfileManager} connectionProfileManager
     * - the ConnectionProfileManager used to manage access connection profiles.
     */
    constructor(connectionProfileManager) {
        super(connectionProfileManager);
        this.dataService = new WebDataService(null, true);
    }

    /**
     * Import an identity into a profile wallet or keystore.
     * @param {string} connectionProfile The name of the connection profile
     * @param {object} connectionOptions The connection options loaded from the profile
     * @param {string} id the id to associate with the identity
     * @param {string} publicKey the public key
     * @param {string} privateKey the private key
     * @returns {Promise} a promise
     */
    importIdentity(connectionProfile, connectionOptions, id, publicKey, privateKey) {
        return this.dataService.ensureCollection('identities')
            .then((identities) => {
                const bytes = publicKey
                    .replace(/-----BEGIN CERTIFICATE-----/, '')
                    .replace(/-----END CERTIFICATE-----/, '')
                    .replace(/[\r\n]+/g, '');
                const certificateContents = Buffer.from(bytes, 'base64');
                const identifier = createHash('sha256').update(certificateContents).digest('hex');
                const secret = uuid.v4().substring(0, 8);
                const identity = {
                    identifier,
                    name: id,
                    issuer: DEFAULT_ISSUER,
                    secret,
                    certificate: publicKey,
                    imported: true
                };
                return identities.add(id, identity);
            });
    }

    /**
     * Establish a connection to the business network.
     * @param {string} connectionProfile The name of the connection profile
     * @param {string} businessNetworkIdentifier The identifier of the business network
     * @param {object} connectionOptions The connection options loaded from the profile
     * @return {Promise} A promise that is resolved with a {@link Connection}
     * object once the connection is established, or rejected with a connection error.
     */
    connect(connectionProfile, businessNetworkIdentifier, connectionOptions) {
        let connection = new WebConnection(this, connectionProfile, businessNetworkIdentifier);
        return Promise.resolve(connection);
    }

}

module.exports = WebConnectionManager;
