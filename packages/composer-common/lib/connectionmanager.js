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

const ConnectionProfileManager = require('./connectionprofilemanager');

/**
 * Base class representing a connection manager that establishes and manages
 * connections to one or more business networks. The ConnectionManager loads
 * connection profiles using the ConnectionProfileManager.
 *
 * @private
 * @abstract
 * @class
 * @memberof module:composer-common
 */
class ConnectionManager {

    /**
     * Create the ConnectionManager
     * @param {ConnectionProfileManager} connectionProfileManager - the ConnectionProfileManager
     * that controls this instance.
     */
    constructor(connectionProfileManager) {
        if(!(connectionProfileManager instanceof ConnectionProfileManager)) {
            throw new Error('Must create ConnectionManager with a ConnectionProfileManager implementation.');
        }

        this.connectionProfileManager = connectionProfileManager;
    }

    /**
     * Returns the ConnectionProfileManager associated with this ConnectionManager
     * @return {ConnectionProfileManager} the connection profile manager for this
     * connection manager.
     */
    getConnectionProfileManager() {
        return this.connectionProfileManager;
    }

    /**
     * Establish a connection to the business network, using connection information
     * from the connection profile.
     * @abstract
     * @param {string} connectionProfile The name of the connection profile
     * @param {string} businessNetworkIdentifier The identifier of the business network, or null if this is an admin connection
     * @param {object} connectionOptions The connection options loaded from the profile
     * @return {Promise} A promise that is resolved with a {@link Connection}
     * object once the connection is established, or rejected with a connection error.
     */
    async connect(connectionProfile, businessNetworkIdentifier, connectionOptions) {
        throw new Error('abstract function called');
    }

    /**
     * Import an identity into a profile wallet or keystore
     * @abstract
     * @param {string} connectionProfile The name of the connection profile
     * @param {object} connectionOptions The connection options loaded from the profile
     * @param {string} id the id to associate with the identity
     * @param {string} certificate the certificate
     * @param {string} privateKey the private key
     * @returns {Promise} a promise which resolves when the identity is imported
     */
    async importIdentity(connectionProfile, connectionOptions, id, certificate, privateKey) {
        throw new Error('abstract function called');
    }

    /**
     * Request an identity's certificates.
     * @abstract
     * @param {string} connectionProfile The name of the connection profile
     * @param {object} connectionOptions The connection options loaded from the profile
     * @param {any} enrollmentID The enrollment id
     * @param {any} enrollmentSecret  The enrollment secret
     * @returns {promise} resolves with the identity certificates, rejected if a problem occurs
     */
    async requestIdentity(connectionProfile, connectionOptions, enrollmentID, enrollmentSecret) {
        throw new Error('abstract function called');
    }

    /**
     * Obtain the credentials associated with a given identity.
     * @abstract
     * @param {String} connectionProfileName Name of the connection profile.
     * @param {Object} connectionOptions connection options loaded from the profile.
     * @param {String} id Name of the identity.
     * @return {Promise} Resolves to credentials in the form <em>{ certificate: String, privateKey: String }</em>, or
     * {@link null} if the named identity does not exist.
     */
    async exportIdentity(connectionProfileName, connectionOptions, id) {
        throw new Error('abstract function called');
    }

    /**
     * Remove any cached credentials associated with a given identity.
     * @abstract
     * @param {String} connectionProfileName Name of the connection profile.
     * @param {Object} connectionOptions connection options loaded from the profile.
     * @param {String} id Name of the identity.
     * @returns {Promise} a promise which resolves when the identity is imported
     */
    async removeIdentity(connectionProfileName, connectionOptions, id) {
        throw new Error('abstract function called');
    }

}

module.exports = ConnectionManager;
