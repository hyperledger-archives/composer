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

const CONNECTION_FILENAME = 'connection.json';
const METADATA_FILENAME = 'metadata.json';
const CREDENTIALS_DIRNAME = 'credentials';

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
     * <p>
     * For PKI-based authentication, the credentials are expected to be of the form:
     * <em>{ public: String, private: String }</em>.
     * @return {Object} credentials.
     */
    getCredentials() {
        return this.credentials;
    }

    /**
     * Enrollment credentials. If there are no credentials associated with this card, these credentials  are used to
     * enroll with a business network and obtain certificates.
     * <p>
     * For an ID/secret enrollment scheme, the credentials are expected to be of the form:
     * <em>{ id: String, secret: String }</em>.
     * @return {Object} enrollment credentials, if they exist.
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
     * Special roles for which this ID can be used, which can include:
     * <ul>
     *   <li>peerAdmin</li>
     *   <li>channelAdmin</li>
     *   <li>issuer</li>
     * </ul>
     * @return {String[]} roles.
     */
    getRoles() {
        return this.metadata.roles || [ ];
    }

    /**
     * Create an IdCard from a card archive.
     * <p>
     * Valid types for <em>zipData</em> are any of the types supported by JSZip.
     * @param {String|ArrayBuffer|Uint8Array|Buffer|Blob|Promise} zipData - card archive data.
     * @return {Promise} Promise to the instantiated IdCard.
     */
    static fromArchive(zipData) {
        const method = 'fromArchive';
        LOG.entry(method, zipData.length);

        return JSZip.loadAsync(zipData).then((zip) => {
            let promise = Promise.resolve();

            let metadata;
            let connection;
            let credentials = Object.create(null);

            LOG.debug(method, 'Loading ' + CONNECTION_FILENAME);
            const connectionFile = zip.file(CONNECTION_FILENAME);
            if (!connectionFile) {
                throw Error('Required file not found: ' + CONNECTION_FILENAME);
            }

            promise = promise.then(() => {
                return connectionFile.async('string');
            }).then((connectionContent) => {
                connection = JSON.parse(connectionContent);
            });

            LOG.debug(method, 'Loading ' + METADATA_FILENAME);
            const metadataFile = zip.file(METADATA_FILENAME);
            if (!metadataFile) {
                throw Error('Required file not found: ' + METADATA_FILENAME);
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

            LOG.debug(method, 'Loading ' + CREDENTIALS_DIRNAME);
            loadDirectoryToObject(CREDENTIALS_DIRNAME, credentials);

            return promise.then(() => {
                const idCard = new IdCard(metadata, connection, credentials);
                LOG.exit(method, idCard.toString());
                return idCard;
            });
        });
    }

    /**
     * Generate a card archive representing this ID card.
     * <p>
     * The default value for the <em>options.type</em> parameter is <em>arraybuffer</em>. See JSZip documentation
     * for other valid values.
     * @param {Object} [options] - JSZip generation options.
     * @param {String} [options.type] - type of the resulting ZIP file data.
     * @return {Promise} Promise of the generated ZIP file; by default an {@link ArrayBuffer}.
     */
    toArchive(options) {
        const method = 'fromArchive';
        LOG.entry(method, options);

        const zipOptions = Object.assign({ type: 'arraybuffer' }, options);
        const zip = new JSZip();

        const connectionContents = JSON.stringify(this.connectionProfile);
        zip.file(CONNECTION_FILENAME, connectionContents);

        const metadataContents = JSON.stringify(this.metadata);
        zip.file(METADATA_FILENAME, metadataContents);

        Object.keys(this.credentials).forEach(credentialName => {
            const filename = CREDENTIALS_DIRNAME + '/' + credentialName;
            const credentialData = this.credentials[credentialName];
            zip.file(filename, credentialData);
        });

        const result = zip.generateAsync(zipOptions);
        LOG.exit(method, result);
        return result;
    }

}

module.exports = IdCard;
