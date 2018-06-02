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

const { Certificate, ConnectionManager } = require('composer-common');
const EmbeddedConnection = require('./embeddedconnection');
const EmbeddedDataService = require('composer-runtime-embedded').EmbeddedDataService;
const uuid = require('uuid');

const IDENTITY_COLLECTION_ID = 'identities';

/**
 * Base class representing a connection manager that establishes and manages
 * connections to one or more business networks.
 * @protected
 * @abstract
 */
class EmbeddedConnectionManager extends ConnectionManager {

    /**
     * Creates a new EmbeddedConnectionManager
     * @param {ConnectionProfileManager} connectionProfileManager
     * - the ConnectionProfileManager used to manage access connection profiles.
     */
    constructor(connectionProfileManager) {
        super(connectionProfileManager);
        this.dataService = new EmbeddedDataService(null, true);
    }

    /**
     * Import an identity into a profile wallet or keystore.
     * @param {string} connectionProfile The name of the connection profile
     * @param {object} connectionOptions The connection options loaded from the profile
     * @param {string} id the id to associate with the identity
     * @param {string} certificate the certificate
     * @param {string} privateKey the private key
     */
    async importIdentity(connectionProfile, connectionOptions, id, certificate, privateKey) {
        const identities = await this.dataService.ensureCollection(IDENTITY_COLLECTION_ID);
        const certificateObj = new Certificate(certificate);
        const identifier = certificateObj.getIdentifier();
        const publicKey = certificateObj.getPublicKey();
        const name = certificateObj.getName();
        const issuer = certificateObj.getIssuer();
        let secret = uuid.v4().substring(0, 8);
        let options = {};

        // Allow an existing identity to be replaced in the connector wallet.
        if (await identities.exists(id)) {
            const curid = await identities.get(id);
            secret = curid.secret;
            options = curid.options;
            await identities.remove(id);
        }
        const identity = {
            identifier,
            name,
            issuer,
            secret,
            certificate,
            publicKey,
            privateKey,
            imported: true,
            options
        };

        await identities.add(id, identity);
    }

     /**
     * Obtain the credentials associated with a given identity.
     * @param {String} connectionProfileName - Name of the connection profile.
     * @param {Object} connectionOptions - connection options loaded from the profile.
     * @param {String} id - Name of the identity.
     * @return {Promise} Resolves to credentials in the form <em>{ certificate: String, privateKey: String }</em>, or
     * {@link null} if the named identity does not exist.
     */
    async exportIdentity(connectionProfileName, connectionOptions, id) {
        const identities = await this.dataService.ensureCollection(IDENTITY_COLLECTION_ID);
        const exists = await identities.exists(id);
        if (!exists) {
            return null;
        }

        const { certificate, privateKey, imported } = await identities.get(id);
        if (imported) {
            return { certificate, privateKey };
        }
        return null;
    }

    /**
     * Remove an identity from the profile wallet.
     * @param {string} connectionProfile The name of the connection profile
     * @param {object} connectionOptions The connection options loaded from the profile
     * @param {string} id the id to associate with the identity
     * @returns {Promise} a promise which resolves to true if identity existed and removed, false otherwise
     * or rejects with an error.
     */
    async removeIdentity(connectionProfile, connectionOptions, id) {
        const identities = await this.dataService.ensureCollection(IDENTITY_COLLECTION_ID);
        const exists = await identities.exists(id);
        if (!exists) {
            return exists;
        }
        const identity = await identities.get(id);
        if (identity.imported) {
            identity.imported = false;
            await identities.update(id, identity);
            return true;
        }

        return false;
    }

   /**
     * Establish a connection to the business network.
     * @param {string} connectionProfile The name of the connection profile
     * @param {string} businessNetworkIdentifier The identifier of the business network
     * @param {object} connectionOptions The connection options loaded from the profile
     * @return {Promise} A promise that is resolved with a {@link Connection}
     * object once the connection is established, or rejected with a connection error.
     */
    async connect(connectionProfile, businessNetworkIdentifier, connectionOptions) {
        return new EmbeddedConnection(this, connectionProfile, businessNetworkIdentifier);
    }

}

module.exports = EmbeddedConnectionManager;
