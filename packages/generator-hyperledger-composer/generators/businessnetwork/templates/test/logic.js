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
/**
 * Write the unit tests for your transction processor functions here
 */

const AdminConnection = require('composer-admin').AdminConnection;
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const { BusinessNetworkDefinition, CertificateUtil, IdCard } = require('composer-common');
const path = require('path');

require('chai').should();

const namespace = '<%= namespace%>';
const assetType = 'SampleAsset';

describe('#' + namespace, () => {
    // In-memory card store for testing so cards are not persisted to the file system
    const cardStore = require('composer-common').NetworkCardStoreManager.getCardStore( { type: 'composer-wallet-inmemory' } );
    let adminConnection;
    let businessNetworkConnection;

    before(async () => {
        // Embedded connection used for local testing
        const connectionProfile = {
            name: 'embedded',
            'x-type': 'embedded'
        };
        // Embedded connection does not need real credentials
        const credentials = CertificateUtil.generate({ commonName: 'admin' });

        // PeerAdmin identity used with the admin connection to deploy business networks
        const deployerMetadata = {
            version: 1,
            userName: 'PeerAdmin',
            roles: [ 'PeerAdmin', 'ChannelAdmin' ]
        };
        const deployerCard = new IdCard(deployerMetadata, connectionProfile);
        deployerCard.setCredentials(credentials);

        const deployerCardName = 'PeerAdmin';
        adminConnection = new AdminConnection({ cardStore: cardStore });

        await adminConnection.importCard(deployerCardName, deployerCard);
        await adminConnection.connect(deployerCardName);
    });

    beforeEach(async () => {
        businessNetworkConnection = new BusinessNetworkConnection({ cardStore: cardStore });

        const adminUserName = 'admin';
        let adminCardName;

        let businessNetworkDefinition = await BusinessNetworkDefinition.fromDirectory(path.resolve(__dirname, '..'));

        // Install the Composer runtime for the new business network
        await adminConnection.install(businessNetworkDefinition);

        // Start the business network and configure an network admin identity
        const startOptions = {
            networkAdmins: [
                {
                    userName: adminUserName,
                    enrollmentSecret: 'adminpw'
                }
            ]
        };

        let adminCards = await adminConnection.start(businessNetworkDefinition.getName(), businessNetworkDefinition.getVersion(), startOptions);
        // Import the network admin identity for us to use
        adminCardName = `${adminUserName}@${businessNetworkDefinition.getName()}`;
        await adminConnection.importCard(adminCardName, adminCards.get(adminUserName));
        // Connect to the business network using the network admin identity
        await businessNetworkConnection.connect(adminCardName);
    });

    describe('ChangeAssetValue()', () => {
        it('should change the value property of ' + assetType + ' to newValue', async () => {
            const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

            // Create a user participant
            const user = factory.newResource(namespace, 'User', '<%= appauthor%>');

            // Create the asset
            const asset = factory.newResource(namespace, assetType, 'ASSET_001');
            asset.value = 'old-value';

            // Create a transaction to change the asset's value property
            const changeAssetValue = factory.newTransaction(namespace, 'ChangeAssetValue');
            changeAssetValue.relatedAsset = factory.newRelationship(namespace, assetType, asset.$identifier);
            changeAssetValue.newValue = 'new-value';

            let assetRegistry = await businessNetworkConnection.getAssetRegistry(namespace + '.' + assetType);

            // Add the asset to the appropriate asset registry
            await assetRegistry.add(asset);
            let userRegistry = await businessNetworkConnection.getParticipantRegistry(namespace + '.User');

            // Add the user to the appropriate participant registry
            await userRegistry.add(user);

            // Submit the transaction
            await businessNetworkConnection.submitTransaction(changeAssetValue);

            // Get the asset
            let newAsset = await assetRegistry.get(asset.$identifier);

            // Assert that the asset has the new value property
            newAsset.value.should.equal(changeAssetValue.newValue);
        });
    });

});
