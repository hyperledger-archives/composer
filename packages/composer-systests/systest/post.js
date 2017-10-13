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

const BusinessNetworkDefinition = require('composer-admin').BusinessNetworkDefinition;

const fs = require('fs');
const path = require('path');

const TestUtil = require('./testutil');
const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));

describe('HTTP POST system tests', () => {
    let bnID;
    beforeEach(() => {
        return TestUtil.resetBusinessNetwork(bnID);
    });
    let businessNetworkDefinition;
    let client;

    before(function () {
        const modelFiles = [
            { fileName: 'models/post.cto', contents: fs.readFileSync(path.resolve(__dirname, 'data/post.cto'), 'utf8') }
        ];
        const scriptFiles=  [
            { identifier: 'post.js', contents: fs.readFileSync(path.resolve(__dirname, 'data/post.js'), 'utf8') }
        ];
        businessNetworkDefinition = new BusinessNetworkDefinition('systest-post@0.0.1', 'The network for the HTTP POST system tests');
        modelFiles.forEach((modelFile) => {
            businessNetworkDefinition.getModelManager().addModelFile(modelFile.contents, modelFile.fileName);
        });
        bnID = businessNetworkDefinition.getName();
        scriptFiles.forEach((scriptFile) => {
            let scriptManager = businessNetworkDefinition.getScriptManager();
            scriptManager.addScript(scriptManager.createScript(scriptFile.identifier, 'JS', scriptFile.contents));
        });
        return TestUtil.deploy(businessNetworkDefinition)
            .then(() => {
                return TestUtil.getClient('systest-post')
                    .then((result) => {
                        client = result;
                    });
            });
    });

    after(function () {
        return TestUtil.undeploy(businessNetworkDefinition);
    });

    it('should update an asset with the the results of an HTTP POST. WARNING, running remote on Bluemix.', () => {
        let factory = client.getBusinessNetwork().getFactory();
        const NS = 'org.acme.sample';

        // create the sample asset
        const sampleAsset = factory.newResource(NS, 'SampleAsset', 'ASSET_001');
        sampleAsset.value = 'my asset';

        const postTransaction = factory.newTransaction(NS, 'PostTransaction');
        postTransaction.a = 1;
        postTransaction.b = 2;
        postTransaction.asset = factory.newRelationship(NS, 'SampleAsset', sampleAsset.$identifier);

        // Get the asset registry.
        return client.getAssetRegistry(NS + '.SampleAsset')
            .then((assetRegistry) => {

                // Add the asset to the asset registry.
                return assetRegistry.add(sampleAsset)
                .then(() => {
                   // submit the transaction
                    return client.submitTransaction(postTransaction);
                })
                .then(() => {
                    return client.getAssetRegistry(NS + '.SampleAsset');
                })
                .then((assetRegistry) => {
                    // get the listing
                    return assetRegistry.get(sampleAsset.$identifier);
                })
                .then((newAsset) => {
                     // the value should have change
                    newAsset.value.should.equal('Count is 3');
                });
            });
    });
});
