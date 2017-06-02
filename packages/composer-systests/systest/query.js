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

    before(function () {
        const modelFiles = [
            fs.readFileSync(path.resolve(__dirname, 'data/query.cto'), 'utf8')
        ];
        const scriptFiles =  [
            { identifier: 'query.js', contents: fs.readFileSync(path.resolve(__dirname, 'data/query.js'), 'utf8') }
        ];
        businessNetworkDefinition = new BusinessNetworkDefinition('systest.query@0.0.1', 'The network for the query system tests');
        modelFiles.forEach((modelFile) => {
            businessNetworkDefinition.getModelManager().addModelFile(modelFile);
        });
        scriptFiles.forEach((scriptFile) => {
            let scriptManager = businessNetworkDefinition.getScriptManager();
            scriptManager.addScript(scriptManager.createScript(scriptFile.identifier, 'JS', scriptFile.contents));
        });

        admin = TestUtil.getAdmin();
        return admin.deploy(businessNetworkDefinition)
            .then(() => {
                return TestUtil.getClient('systest.query')
                    .then((result) => {
                        client = result;
                        let factory = client.getBusinessNetwork().getFactory();
                        let transaction = factory.newTransaction('org.fabric_composer.marbles', 'CreateMable');
                        transaction.marbleId = '1';
                        transaction.email = 'mail1@1234';
                        transaction.colour ='RED';
                        transaction.size = 'SMALL';
                        return client.submitTransaction(transaction);
                    });
            });
    });


    it('should query a valid QueryMarbleByOwner', () => {
        this.timeout(1000); // Delay to prevent transaction failing

        let factory = client.getBusinessNetwork().getFactory();
        let transaction = factory.newTransaction('org.fabric_composer.marbles', 'QueryMarbleByOwner');

        return client.submitTransaction(transaction);
    });
});