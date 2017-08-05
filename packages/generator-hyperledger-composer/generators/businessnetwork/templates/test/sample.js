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

const AdminConnection = require('composer-admin').AdminConnection;
const BrowserFS = require('browserfs/dist/node/index');
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const path = require('path');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));

const bfs_fs = BrowserFS.BFSRequire('fs');

describe('Sample', () => {

    // This is the business network connection the tests will use.
    let businessNetworkConnection;

    // This is the factory for creating instances of types.
    let factory;

    // These are the identities for Alice and Bob.
    let aliceIdentity;
    let bobIdentity;

    // These are a list of receieved events.
    let events;

    // This is called before each test is executed.
    beforeEach(() => {

        // Initialize an in-memory file system, so we do not write any files to the actual file system.
        BrowserFS.initialize(new BrowserFS.FileSystem.InMemory());

        // Create a new admin connection.
        const adminConnection = new AdminConnection({ fs: bfs_fs });

        // Create a new connection profile that uses the embedded (in-memory) runtime.
        return adminConnection.createProfile('defaultProfile', { type : 'embedded' })
            .then(() => {

                // Establish an admin connection. The user ID must be admin. The user secret is
                // ignored, but only when the tests are executed using the embedded (in-memory)
                // runtime.
                return adminConnection.connect('defaultProfile', 'admin', 'adminpw');

            })
            .then(() => {

                // Generate a business network definition from the project directory.
                return BusinessNetworkDefinition.fromDirectory(path.resolve(__dirname, '..'));

            })
            .then((businessNetworkDefinition) => {

                // Deploy and start the business network defined by the business network definition.
                return adminConnection.deploy(businessNetworkDefinition);

            })
            .then(() => {

                // Create and establish a business network connection
                businessNetworkConnection = new BusinessNetworkConnection({ fs: bfs_fs });
                events = [];
                businessNetworkConnection.on('event', (event) => {
                    events.push(event);
                });
                return businessNetworkConnection.connect('defaultProfile', 'basic-sample-network', 'admin', 'adminpw');

            })
            .then(() => {

                // Get the factory for the business network.
                factory = businessNetworkConnection.getBusinessNetwork().getFactory();

                // Create the participants.
                const alice = factory.newResource('org.acme.sample', 'SampleParticipant', 'alice@email.com');
                alice.firstName = 'Alice';
                alice.lastName = 'A';
                const bob = factory.newResource('org.acme.sample', 'SampleParticipant', 'bob@email.com');
                bob.firstName = 'Bob';
                bob.lastName = 'B';
                return businessNetworkConnection.getParticipantRegistry('org.acme.sample.SampleParticipant')
                    .then((participantRegistry) => {
                        participantRegistry.addAll([alice, bob]);
                    });

            })
            .then(() => {

                // Create the assets.
                const asset1 = factory.newResource('org.acme.sample', 'SampleAsset', '1');
                asset1.owner = factory.newRelationship('org.acme.sample', 'SampleParticipant', 'alice@email.com');
                asset1.value = '10';
                const asset2 = factory.newResource('org.acme.sample', 'SampleAsset', '2');
                asset2.owner = factory.newRelationship('org.acme.sample', 'SampleParticipant', 'bob@email.com');
                asset2.value = '20';
                return businessNetworkConnection.getAssetRegistry('org.acme.sample.SampleAsset')
                    .then((assetRegistry) => {
                        assetRegistry.addAll([asset1, asset2]);
                    });
            })
            .then(() => {

                // Issue the identities.
                return businessNetworkConnection.issueIdentity('org.acme.sample.SampleParticipant#alice@email.com', 'alice1')
                    .then((identity) => {
                        aliceIdentity = identity;
                        return businessNetworkConnection.issueIdentity('org.acme.sample.SampleParticipant#bob@email.com', 'bob1');
                    })
                    .then((identity) => {
                        bobIdentity = identity;
                    });

            });

    });

    /**
     * Reconnect using a different identity.
     * @param {Object} identity The identity to use.
     * @return {Promise} A promise that will be resolved when complete.
     */
    function useIdentity(identity) {
        return businessNetworkConnection.disconnect()
            .then(() => {
                businessNetworkConnection = new BusinessNetworkConnection({ fs: bfs_fs });
                events = [];
                businessNetworkConnection.on('event', (event) => {
                    events.push(event);
                });
                return businessNetworkConnection.connect('defaultProfile', 'basic-sample-network', identity.userID, identity.userSecret);
            });
    }

    it('Alice can read all of the assets', () => {

        // Use the identity for Alice.
        return useIdentity(aliceIdentity)
            .then(() => {

                // Get the assets.
                return businessNetworkConnection.getAssetRegistry('org.acme.sample.SampleAsset')
                    .then((assetRegistry) => {
                        return assetRegistry.getAll();

                    });

            })
            .then((assets) => {

                // Validate the assets.
                assets.should.have.lengthOf(2);
                const asset1 = assets[0];
                asset1.owner.getFullyQualifiedIdentifier().should.equal('org.acme.sample.SampleParticipant#alice@email.com');
                asset1.value.should.equal('10');
                const asset2 = assets[1];
                asset2.owner.getFullyQualifiedIdentifier().should.equal('org.acme.sample.SampleParticipant#bob@email.com');
                asset2.value.should.equal('20');

            });

    });

    it('Bob can read all of the assets', () => {

        // Use the identity for Bob.
        return useIdentity(bobIdentity)
            .then(() => {

                // Get the assets.
                return businessNetworkConnection.getAssetRegistry('org.acme.sample.SampleAsset')
                    .then((assetRegistry) => {
                        return assetRegistry.getAll();

                    });

            })
            .then((assets) => {

                // Validate the assets.
                assets.should.have.lengthOf(2);
                const asset1 = assets[0];
                asset1.owner.getFullyQualifiedIdentifier().should.equal('org.acme.sample.SampleParticipant#alice@email.com');
                asset1.value.should.equal('10');
                const asset2 = assets[1];
                asset2.owner.getFullyQualifiedIdentifier().should.equal('org.acme.sample.SampleParticipant#bob@email.com');
                asset2.value.should.equal('20');

            });

    });

    it('Alice can add assets that she owns', () => {

        // Use the identity for Alice.
        return useIdentity(aliceIdentity)
            .then(() => {

                // Create the asset.
                const asset3 = factory.newResource('org.acme.sample', 'SampleAsset', '3');
                asset3.owner = factory.newRelationship('org.acme.sample', 'SampleParticipant', 'alice@email.com');
                asset3.value = '30';

                // Add the asset, then get the asset.
                return businessNetworkConnection.getAssetRegistry('org.acme.sample.SampleAsset')
                    .then((assetRegistry) => {
                        return assetRegistry.add(asset3)
                            .then(() => {
                                return assetRegistry.get('3');
                            });
                    });

            })
            .then((asset3) => {

                // Validate the asset.
                asset3.owner.getFullyQualifiedIdentifier().should.equal('org.acme.sample.SampleParticipant#alice@email.com');
                asset3.value.should.equal('30');

            });

    });

    it('Alice cannot add assets that Bob owns', () => {

        // Use the identity for Alice.
        return useIdentity(aliceIdentity)
            .then(() => {

                // Create the asset.
                const asset3 = factory.newResource('org.acme.sample', 'SampleAsset', '3');
                asset3.owner = factory.newRelationship('org.acme.sample', 'SampleParticipant', 'bob@email.com');
                asset3.value = '30';

                // Add the asset, then get the asset.
                return businessNetworkConnection.getAssetRegistry('org.acme.sample.SampleAsset')
                    .then((assetRegistry) => {
                        return assetRegistry.add(asset3);
                    });

            })
            .should.be.rejectedWith(/does not have .* access to resource/);

    });

    it('Bob can add assets that he owns', () => {

        // Use the identity for Bob.
        return useIdentity(bobIdentity)
            .then(() => {

                // Create the asset.
                const asset4 = factory.newResource('org.acme.sample', 'SampleAsset', '4');
                asset4.owner = factory.newRelationship('org.acme.sample', 'SampleParticipant', 'bob@email.com');
                asset4.value = '40';

                // Add the asset, then get the asset.
                return businessNetworkConnection.getAssetRegistry('org.acme.sample.SampleAsset')
                    .then((assetRegistry) => {
                        return assetRegistry.add(asset4)
                            .then(() => {
                                return assetRegistry.get('4');
                            });
                    });

            })
            .then((asset4) => {

                // Validate the asset.
                asset4.owner.getFullyQualifiedIdentifier().should.equal('org.acme.sample.SampleParticipant#bob@email.com');
                asset4.value.should.equal('40');

            });

    });

    it('Bob cannot add assets that Alice owns', () => {

        // Use the identity for Bob.
        return useIdentity(bobIdentity)
            .then(() => {

                // Create the asset.
                const asset4 = factory.newResource('org.acme.sample', 'SampleAsset', '4');
                asset4.owner = factory.newRelationship('org.acme.sample', 'SampleParticipant', 'alice@email.com');
                asset4.value = '40';

                // Add the asset, then get the asset.
                return businessNetworkConnection.getAssetRegistry('org.acme.sample.SampleAsset')
                    .then((assetRegistry) => {
                        return assetRegistry.add(asset4);
                    });

            })
            .should.be.rejectedWith(/does not have .* access to resource/);

    });

    it('Alice can update her assets', () => {

        // Use the identity for Alice.
        return useIdentity(aliceIdentity)
            .then(() => {

                // Create the asset.
                const asset1 = factory.newResource('org.acme.sample', 'SampleAsset', '1');
                asset1.owner = factory.newRelationship('org.acme.sample', 'SampleParticipant', 'alice@email.com');
                asset1.value = '50';

                // Update the asset, then get the asset.
                return businessNetworkConnection.getAssetRegistry('org.acme.sample.SampleAsset')
                    .then((assetRegistry) => {
                        return assetRegistry.update(asset1)
                            .then(() => {
                                return assetRegistry.get('1');
                            });
                    });

            })
            .then((asset1) => {

                // Validate the asset.
                asset1.owner.getFullyQualifiedIdentifier().should.equal('org.acme.sample.SampleParticipant#alice@email.com');
                asset1.value.should.equal('50');

            });

    });

    it('Alice cannot update Bob\'s assets', () => {

        // Use the identity for Alice.
        return useIdentity(aliceIdentity)
            .then(() => {

                // Create the asset.
                const asset2 = factory.newResource('org.acme.sample', 'SampleAsset', '2');
                asset2.owner = factory.newRelationship('org.acme.sample', 'SampleParticipant', 'bob@email.com');
                asset2.value = '50';

                // Update the asset, then get the asset.
                return businessNetworkConnection.getAssetRegistry('org.acme.sample.SampleAsset')
                    .then((assetRegistry) => {
                        return assetRegistry.update(asset2);
                    });

            })
            .should.be.rejectedWith(/does not have .* access to resource/);

    });

    it('Bob can update his assets', () => {

        // Use the identity for Bob.
        return useIdentity(bobIdentity)
            .then(() => {

                // Create the asset.
                const asset2 = factory.newResource('org.acme.sample', 'SampleAsset', '2');
                asset2.owner = factory.newRelationship('org.acme.sample', 'SampleParticipant', 'bob@email.com');
                asset2.value = '60';

                // Update the asset, then get the asset.
                return businessNetworkConnection.getAssetRegistry('org.acme.sample.SampleAsset')
                    .then((assetRegistry) => {
                        return assetRegistry.update(asset2)
                            .then(() => {
                                return assetRegistry.get('2');
                            });
                    });

            })
            .then((asset2) => {

                // Validate the asset.
                asset2.owner.getFullyQualifiedIdentifier().should.equal('org.acme.sample.SampleParticipant#bob@email.com');
                asset2.value.should.equal('60');

            });

    });

    it('Bob cannot update Alice\'s assets', () => {

        // Use the identity for Bob.
        return useIdentity(bobIdentity)
            .then(() => {

                // Create the asset.
                const asset1 = factory.newResource('org.acme.sample', 'SampleAsset', '1');
                asset1.owner = factory.newRelationship('org.acme.sample', 'SampleParticipant', 'alice@email.com');
                asset1.value = '60';

                // Update the asset, then get the asset.
                return businessNetworkConnection.getAssetRegistry('org.acme.sample.SampleAsset')
                    .then((assetRegistry) => {
                        return assetRegistry.update(asset1);
                    });

            })
            .should.be.rejectedWith(/does not have .* access to resource/);

    });

    it('Alice can remove her assets', () => {

        // Use the identity for Alice.
        return useIdentity(aliceIdentity)
            .then(() => {

                // Remove the asset, then test the asset exists.
                return businessNetworkConnection.getAssetRegistry('org.acme.sample.SampleAsset')
                    .then((assetRegistry) => {
                        return assetRegistry.remove('1')
                            .then(() => {
                                return assetRegistry.exists('1');
                            });
                    });

            })
            .should.eventually.be.false;

    });

    it('Alice cannot remove Bob\'s assets', () => {

        // Use the identity for Alice.
        return useIdentity(aliceIdentity)
            .then(() => {

                // Remove the asset, then test the asset exists.
                return businessNetworkConnection.getAssetRegistry('org.acme.sample.SampleAsset')
                    .then((assetRegistry) => {
                        return assetRegistry.remove('2');
                    });

            })
            .should.be.rejectedWith(/does not have .* access to resource/);

    });

    it('Bob can remove his assets', () => {

        // Use the identity for Bob.
        return useIdentity(bobIdentity)
            .then(() => {

                // Remove the asset, then test the asset exists.
                return businessNetworkConnection.getAssetRegistry('org.acme.sample.SampleAsset')
                    .then((assetRegistry) => {
                        return assetRegistry.remove('2')
                            .then(() => {
                                return assetRegistry.exists('2');
                            });
                    });

            })
            .should.eventually.be.false;

    });

    it('Bob cannot remove Alice\'s assets', () => {

        // Use the identity for Bob.
        return useIdentity(bobIdentity)
            .then(() => {

                // Remove the asset, then test the asset exists.
                return businessNetworkConnection.getAssetRegistry('org.acme.sample.SampleAsset')
                    .then((assetRegistry) => {
                        return assetRegistry.remove('1');
                    });

            })
            .should.be.rejectedWith(/does not have .* access to resource/);

    });

    it('Alice can submit a transaction for her assets', () => {

        // Use the identity for Alice.
        return useIdentity(aliceIdentity)
            .then(() => {

                // Submit the transaction.
                const transaction = factory.newTransaction('org.acme.sample', 'SampleTransaction');
                transaction.asset = factory.newRelationship('org.acme.sample', 'SampleAsset', '1');
                transaction.newValue = '50';
                return businessNetworkConnection.submitTransaction(transaction);

            })
            .then(() => {

                // Get the asset.
                return businessNetworkConnection.getAssetRegistry('org.acme.sample.SampleAsset')
                    .then((assetRegistry) => {
                        return assetRegistry.get('1');
                    });

            })
            .then((asset1) => {

                // Validate the asset.
                asset1.owner.getFullyQualifiedIdentifier().should.equal('org.acme.sample.SampleParticipant#alice@email.com');
                asset1.value.should.equal('50');

                // Validate the events.
                events.should.have.lengthOf(1);
                const event = events[0];
                event.eventId.should.be.a('string');
                event.timestamp.should.be.an.instanceOf(Date);
                event.asset.getFullyQualifiedIdentifier().should.equal('org.acme.sample.SampleAsset#1');
                event.oldValue.should.equal('10');
                event.newValue.should.equal('50');

            });

    });

    it('Alice cannot submit a transaction for Bob\'s assets', () => {

        // Use the identity for Alice.
        return useIdentity(aliceIdentity)
            .then(() => {

                // Submit the transaction.
                const transaction = factory.newTransaction('org.acme.sample', 'SampleTransaction');
                transaction.asset = factory.newRelationship('org.acme.sample', 'SampleAsset', '2');
                transaction.newValue = '50';
                return businessNetworkConnection.submitTransaction(transaction);

            })
            .should.be.rejectedWith(/does not have .* access to resource/);

    });

    it('Bob can submit a transaction for his assets', () => {

        // Use the identity for Bob.
        return useIdentity(bobIdentity)
            .then(() => {

                // Submit the transaction.
                const transaction = factory.newTransaction('org.acme.sample', 'SampleTransaction');
                transaction.asset = factory.newRelationship('org.acme.sample', 'SampleAsset', '2');
                transaction.newValue = '60';
                return businessNetworkConnection.submitTransaction(transaction);

            })
            .then(() => {

                // Get the asset.
                return businessNetworkConnection.getAssetRegistry('org.acme.sample.SampleAsset')
                    .then((assetRegistry) => {
                        return assetRegistry.get('2');
                    });

            })
            .then((asset2) => {

                // Validate the asset.
                asset2.owner.getFullyQualifiedIdentifier().should.equal('org.acme.sample.SampleParticipant#bob@email.com');
                asset2.value.should.equal('60');

                // Validate the events.
                events.should.have.lengthOf(1);
                const event = events[0];
                event.eventId.should.be.a('string');
                event.timestamp.should.be.an.instanceOf(Date);
                event.asset.getFullyQualifiedIdentifier().should.equal('org.acme.sample.SampleAsset#2');
                event.oldValue.should.equal('20');
                event.newValue.should.equal('60');

            });

    });

    it('Bob cannot submit a transaction for Alice\'s assets', () => {

        // Use the identity for Bob.
        return useIdentity(bobIdentity)
            .then(() => {

                // Submit the transaction.
                const transaction = factory.newTransaction('org.acme.sample', 'SampleTransaction');
                transaction.asset = factory.newRelationship('org.acme.sample', 'SampleAsset', '1');
                transaction.newValue = '60';
                return businessNetworkConnection.submitTransaction(transaction);

            })
            .should.be.rejectedWith(/does not have .* access to resource/);

    });

});
