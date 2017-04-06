
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

var AdminConnection = require('composer-admin').AdminConnection;
var BrowserFS = require('browserfs/dist/node/index');
var BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
var BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
var path = require('path');
var fs = require('fs');

require('chai').should();

var bfs_fs = BrowserFS.BFSRequire('fs');
var NS = '<%= namespace%>';

describe('#'+NS, function() {

    var businessNetworkConnection;

    before(function() {
        BrowserFS.initialize(new BrowserFS.FileSystem.InMemory());
        var adminConnection = new AdminConnection({ fs: bfs_fs });
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

            var factory = businessNetworkConnection.getBusinessNetwork().getFactory();

            // create a user
            var user = factory.newResource(NS, 'User', '<%= appauthor%>');

            // create the asset
            var asset = factory.newResource(NS, 'Asset', 'ASSET_001');
            asset.value = 'old-value';

            var changeAssetValue = factory.newTransaction(NS, 'ChangeAssetValue');
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