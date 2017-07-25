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
const path = require('path');

const Logger = require('./log/logger');
const LOG = Logger.getLog('IdCard');

/**
 * An ID card.
 * @class
 * @memberof module:composer-common
 */
class IdCard {

    /**
     * Create the BusinessNetworkDefinition.
     * <p>
     * <strong>Note: Only to be called by framework code. Applications should
     * retrieve instances from {@link IdCard.fromArchive}</strong>
     * @param {Object} metadata - metadata associated with the card.
     * @param {Object} connection - connection properties associated with the card.
     * @param {Map} credentials - map of credential filename String keys to credential data Buffer objects.
     * @param {Map} tlscerts - map of TLS certificate filename String keys to TLS certificate data Buffer objects.
     * @private
     */
    constructor(metadata, connection, credentials, tlscerts) {
        const method = 'constructor';
        LOG.entry(method);

        this.metadata = metadata;
        this.connection = connection;
        this.credentials = credentials;
        this.tlscerts = tlscerts;

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
     * @return {String} description, or {@link undefined} if none exists.
     */
    getDescription() {
        return this.metadata.description;
    }

    /**
     * Business network to which the ID card applies. Generally this will be present but may be omitted for system
     * cards.
     * @return {String} description, or {@link undefined} if none exists.
     */
    getBusinessNetwork() {
        return this.metadata.businessNetwork;
    }

    /**
     * Image associated with the card.
     * @return {Object} an object of the form <i>{ name: imageFileName, data: bufferOfImageData }</i>,
     * or {@link undefined} if none exists.
     */
    getImage() {
        return this.image;
    }

    /**
     * Connection profile for this card.
     * @return {Object} connection profile.
     */
    getConnection() {
        return this.connection;
    }

    /**
     * Credentials associated with this card.
     * @return {Map} Map of filename {@link String} keys to {@link Buffer} data.
     */
    getCredentials() {
        return this.credentials;
    }

    /**
     * TLS certificates used to connect to the business networks.
     * @return {Map} Map of filename {@link String} keys to {@link Buffer} data.
     */
    getTlsCertificates() {
        return this.tlscerts;
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
            let image;
            let connection;
            const credentials = new Map();
            const tlscerts = new Map();

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
                if (!metadata.name) {
                    throw Error('Required meta-data field not found: name');
                }

                if (metadata.image) {
                    LOG.debug(method, 'Loading image ' + metadata.image);

                    const imagePromise = zip.file(metadata.image);
                    if (!imagePromise) {
                        throw Error('Image file not found: ' + metadata.image);
                    }

                    return imagePromise.async('nodebuffer').then((imageContent) => {
                        const shortFilename = path.basename(metadata.image);
                        image = {
                            name: shortFilename,
                            data: imageContent
                        };
                    });
                }
            });

            const loadDirectoryToMap = function(directoryName, map) {
                // Incude '/' following directory name
                const fileIndex = directoryName.length + 1;
                // Find all files that are direct children of specified directory
                const files = zip.file(new RegExp(`^${directoryName}/[^/]+$`));
                files && files.forEach((file) => {
                    promise = promise.then(() => {
                        return file.async('nodebuffer');
                    }).then((content) => {
                        const filename = file.name.slice(fileIndex);
                        map.set(filename, content);
                    });
                });
            };

            LOG.debug(method, 'Loading credentials');
            loadDirectoryToMap('credentials', credentials);

            LOG.debug(method, 'Loading tlscerts');
            loadDirectoryToMap('tlscerts', tlscerts);

            return promise.then(() => {
                const idCard = new IdCard(metadata, connection, credentials, tlscerts);
                idCard.image = image;
                LOG.exit(method, idCard.toString());
                return idCard;
            });
        });
    }

}

module.exports = IdCard;
