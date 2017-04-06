'use strict';
/**
 * Write the unit tests for your transction processor functions here
 */

let AdminConnection = require('composer-admin').AdminConnection;
let BrowserFS = require('browserfs/dist/node/index');
let BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
let BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
let path = require('path');
let fs = require('fs');

require('chai').should();

let bfs_fs = BrowserFS.BFSRequire('fs');
let NS = '<%= namespace%>';

describe('#'+NS, function() {

    let businessNetworkConnection;

    before(function() {
        BrowserFS.initialize(new BrowserFS.FileSystem.InMemory());
        let adminConnection = new AdminConnection({ fs: bfs_fs });
        return adminConnection.createProfile('defaultProfile', {
            type: 'embedded'
        })
        .then(function() {
            return adminConnection.connect('defaultProfile', 'admin', 'Xurw3yU9zI0l');
        })
        .then(function() {
            return BusinessNetworkDefinition.fromDirectory(path.resolve(__dirname, '..'));
        })
        .then(function(businessNetworkDefinition) {
            return adminConnection.deploy(businessNetworkDefinition);
        })
        .then(function() {
            businessNetworkConnection = new BusinessNetworkConnection({ fs: bfs_fs });
            return businessNetworkConnection.connect('defaultProfile', '<%= appname%>', 'admin', 'Xurw3yU9zI0l');
        });
    });

    describe('ChangeAssetValue()', function() {

        it('should change the value property of Asset to newValue', () => {

            let factory = businessNetworkConnection.getBusinessNetwork().getFactory();

            // create a user
            let user = factory.newResource(NS, 'User', '<%= appauthor%>');

            // create the asset
            let asset = factory.newResource(NS, 'Asset', 'ASSET_001');
            asset.value = 'old-value';

            let changeAssetValue = factory.newTransaction(NS, 'ChangeAssetValue');
            changeAssetValue.relatedAsset = factory.newRelationship(NS, 'Asset', asset.$identifier);
            changeAssetValue.newValue = 'new-value';

            // Get the asset registry.
            return businessNetworkConnection.getAssetRegistry(NS + '.Asset')
            .then(function(registry) {

                // Add the Asset to the asset registry.
                return registry.add(asset)
                .then(function() {
                    return businessNetworkConnection.getParticipantRegistry(NS + '.User');
                })
                .then(function(userRegistry) {
                    return userRegistry.add(user);
                })
                .then(function() {
                    // submit the transaction
                    return businessNetworkConnection.submitTransaction(changeAssetValue);
                })
                .then(function() {
                    return businessNetworkConnection.getAssetRegistry(NS + '.Asset');
                })
                .then(function(registry) {
                    // get the listing
                    return registry.get(asset.$identifier);
                })
                .then(function(newAsset) {
                    newAsset.value.should.equal('new-value');
                });
            });
        });
    });
});