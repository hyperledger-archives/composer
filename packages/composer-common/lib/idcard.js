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

const JSZip = require('jszip');

const Logger = require('./log/logger');
const LOG = Logger.getLog('IdCard');

/**
 * An ID card. Encapsulates credentials and other information required to connect to a specific business network
 * as a specific user.
 * <p>
 * Instances of this class should be created using {@link IdCard.fromArchive}.
 * @class
 * @memberof module:composer-common
 */
class IdCard {

    /**
     * Create the IdCard.
     * <p>
     * <strong>Note: Only to be called by framework code. Applications should
     * retrieve instances from {@link IdCard.fromArchive}</strong>
     * @param {Object} metadata - metadata associated with the card.
     * @param {Object} connectionProfile - connection profile associated with the card.
     * @param {Object} credentials - credentials used to connect to business network.
     * @private
     */
    constructor(metadata, connectionProfile, credentials) {
        const method = 'constructor';
        LOG.entry(method);

        if (!(metadata && metadata.name)) {
            throw Error('Required metadata field not found: name');
        }
        if (!(connectionProfile && connectionProfile.name)) {
            throw Error('Required connection field not found: name');
        }

        this.metadata = metadata;
        this.connectionProfile = connectionProfile;
        this.credentials = credentials;

        LOG.exit(method);
    }

    /**
     * Name of the card. This is typically used for display purposes, and is not a unique identifier.
     * <p>
     * This is a mandatory field.
     * @return {String} name of the card.
     */
    getName() {
        return this.metadata.name;
    }

    /**
     * Free text description of the card.
     * @return {String} card description.
     */
    getDescription() {
        return this.metadata.description || '';
    }

    /**
     * Name of the business network to which the ID card applies. Generally this will be present but may be
     * omitted for system cards.
     * @return {String} business network name.
     */
    getBusinessNetworkName() {
        return this.metadata.businessNetwork || '';
    }

    /**
     * Connection profile for this card.
     * <p>
     * This is a mandatory field.
     * @return {Object} connection profile.
     */
    getConnectionProfile() {
        return this.connectionProfile;
    }

    /**
     * Credentials associated with this card, and which are used to connect to the associated business network.
     * @return {Object} credentials in the form <em>{ public: publicKey, private: privateKey }</em>, if they exist.
     */
    getCredentials() {
        return this.credentials;
    }

    /**
     * Enrollment credentials. If there are no credentials associated with this card, these credentials  are used to
     * enroll with a business network and obtain certificates.
     * @return {Object} enrollment credentials in the form <em>{ id: enrollmentId, secret: enrollmentSecret }</em>, if
     * they exist.
     */
    getEnrollmentCredentials() {
        let result = null;
        const id = this.metadata.enrollmentId;
        const secret = this.metadata.enrollmentSecret;
        if (id || secret) {
            result = Object.create(null);
            result.id = id;
            result.secret = secret;
        }
        return result;
    }

    /**
     * Create an IdCard from a card archive.
     * @param {Buffer} buffer - the Buffer to a zip archive
     * @return {Promise} Promise to the instantiated IdCard
     */
    static fromArchive(buffer) {
        const method = 'fromArchive';
        LOG.entry(method, buffer.length);

        return JSZip.loadAsync(buffer).then((zip) => {
            let promise = Promise.resolve();

            let metadata;
            let connection;
            let credentials = Object.create(null);

            LOG.debug(method, 'Loading connection.json');
            const connectionFile = zip.file('connection.json');
            if (!connectionFile) {
                throw Error('Required file not found: connection.json');
            }

            promise = promise.then(() => {
                return connectionFile.async('string');
            }).then((connectionContent) => {
                connection = JSON.parse(connectionContent);
            });

            LOG.debug(method, 'Loading metadata.json');
            const metadataFile = zip.file('metadata.json');
            if (!metadataFile) {
                throw Error('Required file not found: metadata.json');
            }

            promise = promise.then(() => {
                return metadataFile.async('string');
            }).then((metadataContent) => {
                metadata = JSON.parse(metadataContent);
            });

            const loadDirectoryToObject = function(directoryName, obj) {
                // Incude '/' following directory name
                const fileIndex = directoryName.length + 1;
                // Find all files that are direct children of specified directory
                const files = zip.file(new RegExp(`^${directoryName}/[^/]+$`));
                files && files.forEach((file) => {
                    promise = promise.then(() => {
                        return file.async('string');
                    }).then((content) => {
                        const filename = file.name.slice(fileIndex);
                        obj[filename] = content;
                    });
                });
            };

            LOG.debug(method, 'Loading credentials');
            loadDirectoryToObject('credentials', credentials);

            return promise.then(() => {
                const idCard = new IdCard(metadata, connection, credentials);
                LOG.exit(method, idCard.toString());
                return idCard;
            });
        });
    }

}

module.exports = IdCard;
