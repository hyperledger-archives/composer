'use strict';
/**
 * Write the unit tests for your transction processor functions here
 */

var AdminConnection = require('composer-admin').AdminConnection;
var BrowserFS = require('browserfs/dist/node/index');
var BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
var BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
var path = require('path');
var fs = require('fs');

require('chai').should();

var bfs_fs = BrowserFS.BFSRequire('fs');
var NS = '<%= namespace%>';

var assetType = 'SampleAsset';

describe('#'+NS, function() {

    var businessNetworkConnection;

    before(function() {
        BrowserFS.initialize(new BrowserFS.FileSystem.InMemory());
        var adminConnection = new AdminConnection({ fs: bfs_fs });
        return adminConnection.createProfile('defaultProfile', {
            type: 'embedded'
        })
        .then(function() {
            return adminConnection.connectWithDetails('defaultProfile', 'admin', 'Xurw3yU9zI0l');
        })
        .then(function() {
            return BusinessNetworkDefinition.fromDirectory(path.resolve(__dirname, '..'));
        })
        .then(function(businessNetworkDefinition) {
            return adminConnection.deploy(businessNetworkDefinition);
        })
        .then(function() {
            businessNetworkConnection = new BusinessNetworkConnection({ fs: bfs_fs });
            return businessNetworkConnection.connectWithDetails('defaultProfile', '<%= appname%>', 'admin', 'Xurw3yU9zI0l');
        });
    });

    describe('ChangeAssetValue()', function() {

        it('should change the value property of ' + assetType + ' to newValue', () => {

            var factory = businessNetworkConnection.getBusinessNetwork().getFactory();

            // create a user
            var user = factory.newResource(NS, 'User', '<%= appauthor%>');

            // create the asset
            var asset = factory.newResource(NS, assetType, 'ASSET_001');
            asset.value = 'old-value';

            var changeAssetValue = factory.newTransaction(NS, 'ChangeAssetValue');
            changeAssetValue.relatedAsset = factory.newRelationship(NS, assetType, asset.$identifier);
            changeAssetValue.newValue = 'new-value';

            // Get the asset registry.
            return businessNetworkConnection.getAssetRegistry(NS + '.' + assetType)
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
                    return businessNetworkConnection.getAssetRegistry(NS + '.' + assetType);
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