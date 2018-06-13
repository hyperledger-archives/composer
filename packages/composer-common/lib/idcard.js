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

const mkdirp = require('mkdirp');
const nodeFs = require('fs');
const path = require('path');
const process = require('process');
const thenifyAll = require('thenify-all');
const yaml = require('js-yaml');
const JSZip = require('jszip');

const thenifyMkdirp = thenifyAll(mkdirp);

const Logger = require('./log/logger');
const LOG = Logger.getLog('IdCard');

const CONNECTION_FILE_JSON = 'connection.json';
const CONNECTION_FILE_YAML = 'connection.yaml';
const METADATA_FILENAME = 'metadata.json';
const CREDENTIALS_DIRNAME = 'credentials';

const CURRENT_VERSION = 1;

const newErrorWithCause = (message, cause) => {
    const error = new Error(message);
    error.cause = cause;
    return error;
};

/**
 * Business Network Card. Encapsulates credentials and other information required to connect to a specific business network
 * as a specific user.
 *
 * Instances of this class can be created using IdCard.fromArchive or IdCard.fromDirectory, as well as the constructor.
 *
 * @summary Business Network Card to connect to a business network
 * @class
 * @memberof module:composer-common
 */
class IdCard {

    /**
     * Create the IdCard.
     * @param {Object} metadata - metadata associated with the card.
     * @param {Object} connectionProfile - connection profile associated with the card.
     */
    constructor(metadata, connectionProfile) {
        const method = 'constructor';
        LOG.entry(method);

        if (!metadata) {
            throw new Error('Missing metadata');
        }

        if (metadata.version || metadata.version === 0) {
            // Migrate earlier versions using fall-through logic to migrate in single version steps
            switch (metadata.version) {
            case 0:
                metadata.userName = metadata.enrollmentId;
                delete metadata.enrollmentId;
                delete metadata.name;
                metadata.version = 1;
            }

            if (metadata.version !== CURRENT_VERSION) {
                throw new Error(`Incompatible card version ${metadata.version}. Current version is ${CURRENT_VERSION}`);
            }
        } else {
            metadata.version = CURRENT_VERSION;
        }

        if (!metadata.userName) {
            throw new Error('Required metadata field not found: userName');
        }
        if (!(connectionProfile && connectionProfile.name)) {
            throw new Error('Required connection field not found: name');
        }
        this.metadata = metadata;
        this.connectionProfile = connectionProfile;
        this.credentials = { };

        LOG.exit(method);
    }

    /**
     * Name of the user identity associated with the card. This should be unique within the scope of a given
     * business network and connection profile.
     *
     * This is a mandatory field.
     * @return {String} Name of the user identity.
     */
    getUserName() {
        return this.metadata.userName;
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
     *
     * This is a mandatory field.
     * @return {Object} connection profile.
     */
    getConnectionProfile() {
        let newprofile = Object.assign({}, this.connectionProfile);
        delete newprofile.wallet;
        return newprofile;
    }

    /**
     * Credentials associated with this card, and which are used to connect to the associated business network.
     * <p>
     * For PKI-based authentication, the credentials are expected to be of the form:
     * <em>{ certificate: String, privateKey: String }</em>.
     * @return {Object} credentials.
     */
    getCredentials() {
        return this.credentials;
    }

    /**
     * Credentials to associate with this card.
     * <p>
     * For PKI-based authentication, the credentials are expected to be of the form:
     * <em>{ certificate: String, privateKey: String }</em>.
     * @param {Object} credentials credentials.
     */
    setCredentials(credentials) {
        const method = 'setCredentials';
        LOG.entry(method, credentials);

        this.credentials = credentials || { };

        LOG.exit(method);
    }

    /**
     * Enrollment credentials. If there are no credentials associated with this card, these credentials  are used to
     * enroll with a business network and obtain certificates.
     * <p>
     * For an ID/secret enrollment scheme, the credentials are expected to be of the form:
     * <em>{ secret: String }</em>.
     * @return {Object} enrollment credentials, or null if none exist.
     */
    getEnrollmentCredentials() {
        const secret = this.metadata.enrollmentSecret;
        return secret ? { secret : secret } : null;
    }

    /**
     * Special roles for which this ID can be used, which can include:
     * <ul>
     *   <li>PeerAdmin</li>
     *   <li>ChannelAdmin</li>
     *   <li>Issuer</li>
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
            let credentials = { };

            LOG.debug(method, 'Loading ' + CONNECTION_FILE_JSON);
            let connectionFile = zip.file(CONNECTION_FILE_JSON);
            if (!connectionFile) {
                throw Error('Required file not found: ' + CONNECTION_FILE_JSON);
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
                // First cut of ID cards did not have a version so call them version zero
                if (!metadata.version) {
                    metadata.version = 0;
                }
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
                const idCard = new IdCard(metadata, connection);
                idCard.setCredentials(credentials);
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
     * @return {Promise} Promise of the generated ZIP file; by default an ArrayBuffer.
     */
    toArchive(options) {
        const method = 'fromArchive';
        LOG.entry(method, options);

        const zipOptions = Object.assign({ type: 'arraybuffer' }, options);
        const zip = new JSZip();

        const connectionContents = JSON.stringify(this.connectionProfile);
        zip.file(CONNECTION_FILE_JSON, connectionContents);

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

    /**
     * Create an IdCard from a directory consisting of the content of an ID card.
     * @param {String} cardDirectory directory containing card data.
     * @param {*} [fs] Node file system API implementation to use for reading card data.
     * Defaults to the Node implementation.
     * @return {Promise} Promise that resolves to an IdCard.
     */
    static fromDirectory(cardDirectory, fs) {
        const method = 'fromDirectory';
        LOG.entry(method, cardDirectory);

        if (!fs) {
            fs = nodeFs;
        }

        let metadata;
        let connection;
        const credentials = { };

        fs = thenifyAll(fs);

        const readOptions = {
            encoding: 'utf8',
            flag: 'r'
        };
        const metadataPath = path.resolve(cardDirectory, METADATA_FILENAME);
        const connectionPathJSON = path.resolve(cardDirectory, CONNECTION_FILE_JSON);
        const connectionPathYAML = path.resolve(cardDirectory, CONNECTION_FILE_YAML);
        const credentialsPath = path.resolve(cardDirectory, CREDENTIALS_DIRNAME);

        let isYAML = true;
        let causeJSON;

        return fs.stat(cardDirectory).catch(cause => {
            throw newErrorWithCause('Unable to read card directory: ' + cardDirectory, cause);
        }).then(() => {
            return fs.readFile(metadataPath, readOptions).catch(cause => {
                throw newErrorWithCause('Unable to read required file: ' + METADATA_FILENAME, cause);
            });
        }).then(metadataContent => {
            metadata = JSON.parse(metadataContent);
            // First cut of ID cards did not have a version so call them version zero
            if (!metadata.version) {
                metadata.version = 0;
            }
        }).then(() => {
            return fs.readFile(connectionPathJSON, readOptions).catch(cause => {
                causeJSON = cause;
                return null;
            });
        }).then(connectionContent => {
            if (connectionContent) {
                isYAML = false;
                return connectionContent;
            }
            return fs.readFile(connectionPathYAML, readOptions).catch(cause => {
                throw new Error(`Unable to read required file ${CONNECTION_FILE_JSON} - ${causeJSON} or ${CONNECTION_FILE_YAML} - ${cause}.`);
            });

        }).then(connectionContent => {
            if (isYAML) {
                connection = yaml.safeLoad(connectionContent);
            }
            else {
                connection = JSON.parse(connectionContent);
            }
        }).then(() => {
            return fs.readdir(credentialsPath).then(credentialFilenames => {
                const credentialPromises = [];
                credentialFilenames.forEach(filename => {
                    const filePath = path.resolve(credentialsPath, filename);
                    credentialPromises.push(
                        fs.readFile(filePath, readOptions).then(credentialData => {
                            credentials[filename] = credentialData;
                        })
                    );
                });
                return Promise.all(credentialPromises);
            }).catch(cause => {
                // Ignore missing credentials as they are optional
                LOG.debug(method, 'Ignored error reading credentials', cause);
            });
        }).then(() => {
            const idCard = new IdCard(metadata, connection);
            idCard.setCredentials(credentials);

            LOG.exit(method, idCard);
            return idCard;
        });
    }

    /**
     * Save the content of an IdCard a directory.
     * @param {String} cardDirectory directory to save card data.
     * @param {*} [fs] Node file system API implementation to use for writing card data.
     * Defaults to the Node implementation.
     * @return {Promise} Promise that resolves then the save is complete.
     */
    toDirectory(cardDirectory, fs) {
        const method = 'toDirectory';

        if (!fs) {
            fs = nodeFs;
        }

        const metadataPath = path.join(cardDirectory, METADATA_FILENAME);
        const connectionPath = path.join(cardDirectory, CONNECTION_FILE_JSON);
        const credentialsDir = path.join(cardDirectory, CREDENTIALS_DIRNAME);

        const umask = process.umask();
        const createDirMode = 0o0750 & ~umask; // At most: user=all, group=read/execute, others=none
        const createFileMode = 0o0640 & ~umask; // At most: user=read/write, group=read, others=none
        const mkdirpOptions = {
            fs: fs,
            mode: createDirMode
        };
        const writeFileOptions = {
            encoding: 'utf8',
            mode: createFileMode
        };

        fs = thenifyAll(fs);

        return thenifyMkdirp(cardDirectory, mkdirpOptions).then(() => {
            const metadataContent = JSON.stringify(this.metadata);
            return fs.writeFile(metadataPath, metadataContent, writeFileOptions);
        }).then(() => {
            const connectionContent = JSON.stringify(this.connectionProfile);
            return fs.writeFile(connectionPath, connectionContent, writeFileOptions);
        }).then(() => {
            return thenifyMkdirp(credentialsDir, mkdirpOptions);
        }).then(() => {
            const credentialPromises = [];
            Object.keys(this.credentials).forEach(credentialName => {
                const credentialPath = path.join(credentialsDir, credentialName);
                const credentialContent = this.credentials[credentialName];
                const promise = fs.writeFile(credentialPath, credentialContent, writeFileOptions);
                credentialPromises.push(promise);
            });
            return Promise.all(credentialPromises);
        }).catch(cause => {
            LOG.error(method, cause);
            throw newErrorWithCause(`Failed to save card to directory: ${cardDirectory}. Reason: ${cause.message}`, cause);
        });
    }

}

module.exports = IdCard;
