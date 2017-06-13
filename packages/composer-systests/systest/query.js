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
chai.use(require('chai-subset'));

describe('Query system tests', function () {
    let businessNetworkDefinition;
    let admin;
    let client;
    let scriptManager;

    before(function () {
        if(!TestUtil.isHyperledgerFabricV1()){
            this.skip();
            return;
        }
        const modelFiles = [
            {fileName: 'models/query.cto', contents: fs.readFileSync(path.resolve(__dirname, 'data/query.cto'), 'utf8')}
        ];
        const scriptFiles =  [
            { identifier: 'query.js', contents: fs.readFileSync(path.resolve(__dirname, 'data/query.js'), 'utf8') }
        ];
        businessNetworkDefinition = new BusinessNetworkDefinition('systest.query@0.0.1', 'The network for the query system tests');
        modelFiles.forEach((modelFile) => {
            businessNetworkDefinition.getModelManager().addModelFile(modelFile.contents, modelFile.fileName);
        });
        scriptFiles.forEach((scriptFile) => {
            scriptManager = businessNetworkDefinition.getScriptManager();
            scriptManager.addScript(scriptManager.createScript(scriptFile.identifier, 'JS', scriptFile.contents));
        });

        admin = TestUtil.getAdmin();
        return admin.deploy(businessNetworkDefinition)
            .then(() => {
                return TestUtil.getClient('systest.query')
                    .then((result) => {
                        client = result;
                    });
            });
    });

    /**
     * create a list of marbles
     * @return {Promise} a promise to the created marbles
     */
    function addMarbles() {
        let factory = client.getBusinessNetwork().getFactory();
        let player = factory.newResource('org.fabric_composer.marbles', 'Player', 'fenglian@email.com');
        player.firstName = 'Fenglian';
        player.lastName = 'Xu';

        return client.getParticipantRegistry('org.fabric_composer.marbles.Player')
        .then((participantRegistry) => {
            return participantRegistry.add(player);
        })
        .then(() => {
            return client.getAssetRegistry('org.fabric_composer.marbles.Marble');
        })
        .then((marbleAssetRegistry) => {
            let factory = client.getBusinessNetwork().getFactory();
            let promises = [];

            for(let n=0;n<10;n++) {
                const marble = factory.newResource('org.fabric_composer.marbles', 'Marble', 'Marble:' + n);
                if(n % 2 === 0) {
                    marble.colour ='RED';
                    marble.size = 'SMALL';
                }
                else {
                    marble.colour ='BLUE';
                    marble.size = 'LARGE';
                }

                marble.owner = factory.newRelationship( 'org.fabric_composer.marbles', 'Player', 'fenglian@email.com');
                promises.push(marbleAssetRegistry.add(marble));
            }

            return Promise.all(promises);
        });
    }


    it('should sunmit a QueryMarbleByOwner transaction (TP function checks query results)', () => {
        this.timeout(1000); // Delay to prevent transaction failing

        let factory = client.getBusinessNetwork().getFactory();

        return addMarbles()
        .then(() => {
            return client.getParticipantRegistry('org.fabric_composer.marbles.Player');
        })
        .then((participantRegistry) => {
            return participantRegistry.get('fenglian@email.com');
        })
        .then((player) => {
            player.firstName.should.equal('Fenglian');
            return;
        })
        .then(() => {
            let transaction = factory.newTransaction('org.fabric_composer.marbles', 'QueryMarbleByOwner');
            return client.submitTransaction(transaction);
        });
    });
});