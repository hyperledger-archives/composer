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

const namespace = '<%= namespace%>';
const assetType = 'SampleAsset';

describe('#' + namespace, () => {
    // In-memory card store for testing so cards are not persisted to the file system
    const cardStore = new MemoryCardStore();
    let adminConnection;
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

        return adminConnection.importCard(deployerCardName, deployerCard).then(() => {
            return adminConnection.connect(deployerCardName);
        });
    });

    beforeEach(() => {
        businessNetworkConnection = new BusinessNetworkConnection({ cardStore: cardStore });

        const adminUserName = 'admin';
        let adminCardName;
        let businessNetworkDefinition;

        return BusinessNetworkDefinition.fromDirectory(path.resolve(__dirname, '..')).then(definition => {
            businessNetworkDefinition = definition;
            // Install the Composer runtime for the new business network
            return adminConnection.install(businessNetworkDefinition.getName());
        }).then(() => {
            // Start the business network and configure an network admin identity
            const startOptions = {
                networkAdmins: [
                    {
                        userName: adminUserName,
                        enrollmentSecret: 'adminpw'
                    }
                ]
            };
            return adminConnection.start(businessNetworkDefinition, startOptions);
        }).then(adminCards => {
            // Import the network admin identity for us to use
            adminCardName = `${adminUserName}@${businessNetworkDefinition.getName()}`;
            return adminConnection.importCard(adminCardName, adminCards.get(adminUserName));
        }).then(() => {
            // Connect to the business network using the network admin identity
            return businessNetworkConnection.connect(adminCardName);
        });
    });

    describe('ChangeAssetValue()', () => {
        it('should change the value property of ' + assetType + ' to newValue', () => {
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

            let assetRegistry;

            return businessNetworkConnection.getAssetRegistry(namespace + '.' + assetType).then(registry => {
                assetRegistry = registry;
                // Add the asset to the appropriate asset registry
                return registry.add(asset);
            }).then(() => {
                return businessNetworkConnection.getParticipantRegistry(namespace + '.User');
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
