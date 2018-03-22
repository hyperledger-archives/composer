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

const { BusinessNetworkDefinition } = require('composer-common');

const BUFFER_ENCODING = 'binary';

/**
 * Stores information about installed and started chaincode.
 * Mimics the chaincode lifecycle of Hyperledger Fabric.
 * @private
 */
class ChaincodeStore {
    /**
     * Constructor.
     * @param {DataCollection} dataCollection The underlying chaincode storage collection.
     */
    constructor(dataCollection) {
        this.dataCollection = dataCollection;
    }

    /**
     * Install a business network as chaincode.
     * @param {BusinessNetworkDefinition} networkDefinition business network definition.
     * @async
     */
    async install(networkDefinition) {
        const chaincodeRecord = await this._createChaincodeRecord(networkDefinition);
        const networkName = chaincodeRecord.name;
        const networkVersion = chaincodeRecord.version;

        if (await this.dataCollection.exists(networkName)) {
            const networkRecord = await this.dataCollection.get(networkName);

            if (networkRecord.installedChaincodes[networkVersion]) {
                throw new Error('Chaincode already installed: ' + this._createChaincodeId(networkName, networkVersion));
            }

            networkRecord.installedChaincodes[networkVersion] = chaincodeRecord;
            await this.dataCollection.update(networkName, networkRecord);
        } else {
            const networkRecord = this._createNetworkRecord(networkName);
            networkRecord.installedChaincodes[networkVersion] = chaincodeRecord;
            await this.dataCollection.add(networkName, networkRecord);
        }
    }

    /**
     * Create a record representing a business network, which can then be stored in the internal
     * data collection.
     * @param {String} networkName business network name.
     * @return {Object} network record.
     * @private
     */
    _createNetworkRecord(networkName) {
        return {
            name: networkName,
            activeVersion: null,
            installedChaincodes: {}
        };
    }

    /**
     * Create a record representing a business network definition as chaincode, which can then be stored in a
     * network record.
     * @param {BusinessNetworkDefinition} networkDefinition business network definition.
     * @return {Object} chaincode record.
     * @private
     * @async
     */
    async _createChaincodeRecord(networkDefinition) {
        const networkName = networkDefinition.getName();
        const networkVersion = networkDefinition.getVersion();
        return {
            id: this._createChaincodeId(networkName, networkVersion),
            name: networkName,
            version: networkVersion,
            networkArchive: await this._serializeNetworkDefinition(networkDefinition)
        };
    }

    /**
     * Serialize a business network definition ready for persistent storage.
     * @param {BusinessNetworkDefinition} networkDefinition business network definition.
     * @return {*} serialized business network definition.
     * @private
     * @async
     */
    async _serializeNetworkDefinition(networkDefinition) {
        const networkArchive = await networkDefinition.toArchive();
        return networkArchive.toString(BUFFER_ENCODING);
    }

    /**
     * Deserialize a business network definition retrieved from persistent storage.
     * @param {*} serializedDefinition serialized business network definition.
     * @return {BusinessNetworkDefinition} business network definition.
     * @private
     * @async
     */
    async _deserializeNetworkDefinition(serializedDefinition) {
        const networkArchive = Buffer.from(serializedDefinition, BUFFER_ENCODING);
        return await BusinessNetworkDefinition.fromArchive(networkArchive);
    }

    /**
     * Start a previously installed chaincode.
     * @param {String} networkName business network name.
     * @param {String} networkVersion business network version.
     * @return {BusinessNetworkDefinition} business network definition
     * @async
     */
    async start(networkName, networkVersion) {
        const networkRecord = await this.dataCollection.get(networkName);
        const chaincodeRecord = networkRecord.installedChaincodes[networkVersion];

        if (networkRecord.activeVersion) {
            throw new Error('Chaincode already started: ' +
                this._createChaincodeId(networkName, networkRecord.activeVersion));
        }

        if (!chaincodeRecord) {
            throw new Error('Chaincode not installed: ' + this._createChaincodeId(networkName, networkVersion));
        }

        networkRecord.activeVersion = networkVersion;
        await this.dataCollection.update(networkRecord.name, networkRecord);

        return await this._deserializeNetworkDefinition(chaincodeRecord.networkArchive);
    }

    /**
     * Upgrade a previously started chaincode to a new installed version.
     * @param {String} networkName business network name.
     * @param {String} networkVersion business network version.
     * @return {BusinessNetworkDefinition} business network definition
     * @async
     */
    async upgrade(networkName, networkVersion) {
        const networkRecord = await this.dataCollection.get(networkName);
        const chaincodeRecord = networkRecord.installedChaincodes[networkVersion];

        if (!chaincodeRecord) {
            throw new Error('Chaincode not installed: ' + this._createChaincodeId(networkName, networkVersion));
        }

        if (!networkRecord.activeVersion) {
            throw new Error('Network not started: ' + networkName);
        }

        networkRecord.activeVersion = networkVersion;
        await this.dataCollection.update(networkRecord.name, networkRecord);

        return await this._deserializeNetworkDefinition(chaincodeRecord.networkArchive);
    }

    /**
     * Create a chaincode record identifier from a business network name and version.
     * @param {String} networkName business network name.
     * @param {String} networkVersion business network version.
     * @return {String} chaincode record identifier.
     * @private
     */
    _createChaincodeId(networkName, networkVersion) {
        return networkName + '@' + networkVersion;
    }

    /**
     * Get the chaincode information for started business network.
     * @param {String} networkName business network name.
     * @return {BusinessNetworkDefinition} business network definition.
     * @async
     */
    async getStartedChaincode(networkName) {
        const networkRecord = await this.dataCollection.get(networkName);
        const activeVersion = networkRecord.activeVersion;

        if (!activeVersion) {
            throw new Error('Network not started: ' + networkName);
        }

        const chaincodeRecord = networkRecord.installedChaincodes[activeVersion];
        return await BusinessNetworkDefinition.fromArchive(chaincodeRecord.networkArchive);
    }

    /**
     * Remove all chaincode versions for a business network.
     * @param {String} networkName business network name.
     * @async
     */
    async removeNetwork(networkName) {
        await this.dataCollection.remove(networkName);
    }
}

module.exports = ChaincodeStore;
