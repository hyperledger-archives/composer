'use strict';
/**
 * Write the unit tests for your transction processor functions here
 */

const AdminConnection = require('composer-admin').AdminConnection;
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const IdCard = require('composer-common').IdCard;
const MemoryCardStore = require('composer-common').MemoryCardStore;

const path = require('path');

require('chai').should();

const NS = '<%= namespace%>';
const assetType = 'SampleAsset';

describe('#' + NS, () => {
    let businessNetworkConnection;

    before(() => {
        // Embedded connection used for local testing
        const connectionProfile = {
            name: 'embedded',
            type: 'embedded'
        };
        // Embedded connection does not need real credentials
        const credentials = {
            certificate: 'FAKE CERTIFICATE',
            privateKey: 'FAKE PRIVATE KEY'
        };

        // Identity used with the admin connection to deploy business networks
        const deployerMetadata = {
            version: 1,
            userName: 'PeerAdmin',
            roles: [ 'PeerAdmin', 'ChannelAdmin' ]
        };
        const deployerCard = new IdCard(deployerMetadata, connectionProfile);
        deployerCard.setCredentials(credentials);

        // Identity used to connect to business networks
        const userMetadata = {
            version: 1,
            userName: 'admin',
            businessNetwork: '<%= appname%>'
        };
        const userCard = new IdCard(userMetadata, connectionProfile);
        userCard.setCredentials(credentials);

        const deployerCardName = 'deployer';
        const userCardName = 'user';

        // In-memory card store for testing so cards are not persisted to the file system
        const cardStore = new MemoryCardStore();
        const adminConnection = new AdminConnection({ cardStore: cardStore });

        return adminConnection.importCard(deployerCardName, deployerCard).then(() => {
            return adminConnection.importCard(userCardName, userCard);
        }).then(() => {
            return adminConnection.connect(deployerCardName);
        }).then(() => {
            return BusinessNetworkDefinition.fromDirectory(path.resolve(__dirname, '..'));
        }).then(businessNetworkDefinition => {
            return adminConnection.deploy(businessNetworkDefinition);
        }).then(() => {
            businessNetworkConnection = new BusinessNetworkConnection({ cardStore: cardStore });
            return businessNetworkConnection.connect(userCardName);
        });
    });

    describe('ChangeAssetValue()', () => {
        it('should change the value property of ' + assetType + ' to newValue', () => {
            const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

            // Create a user participant
            const user = factory.newResource(NS, 'User', '<%= appauthor%>');

            // Create the asset
            const asset = factory.newResource(NS, assetType, 'ASSET_001');
            asset.value = 'old-value';

            // Create a transaction to change the asset's value property
            const changeAssetValue = factory.newTransaction(NS, 'ChangeAssetValue');
            changeAssetValue.relatedAsset = factory.newRelationship(NS, assetType, asset.$identifier);
            changeAssetValue.newValue = 'new-value';

            let assetRegistry;

            return businessNetworkConnection.getAssetRegistry(NS + '.' + assetType).then(registry => {
                assetRegistry = registry;
                // Add the asset to the appropriate asset registry
                return registry.add(asset);
            }).then(() => {
                return businessNetworkConnection.getParticipantRegistry(NS + '.User');
            }).then(userRegistry => {
                // Add the user to the appropriate participant registry
                return userRegistry.add(user);
            }).then(() => {
                // Submit the transaction
                return businessNetworkConnection.submitTransaction(changeAssetValue);
            }).then(registry => {
                // Get the asset
                return assetRegistry.get(asset.$identifier);
            }).then(newAsset => {
                // Assert that the asset has the new value property
                newAsset.value.should.equal(changeAssetValue.newValue);
            });
        });
    });

});
