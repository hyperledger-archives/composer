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

// Place holder for later tests

const BusinessNetworkDefinition = require('composer-admin').BusinessNetworkDefinition;

const fs = require('fs');
const path = require('path');
// const uuid = require('uuid');

const TestUtil = require('./testutil');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));

process.setMaxListeners(Infinity);

describe('Historian', () => {

    describe('CRUD Asset', () => {
        it('should track updates for CREATE asset calls ', () => {});
        it('should track updates for RETRIEVE asset calls ', () => {});
        it('should track updates for UPDATE asset calls ', () => {});
        it('should track updates for DELETE asset calls ', () => {});
    } );

    describe('CRUD Participant', () => {
        it('should track updates for CREATE Participant calls ', () => {});
        it('should track updates for RETRIEVE Participant calls ', () => {});
        it('should track updates for UPDATE Participant calls ', () => {});
        it('should track updates for DELETE Participant calls ', () => {});
    } );

    describe('CRUD Identity', () => {
        it('should track updates for CREATE Identity calls ', () => {});
        it('should track updates for RETRIEVE Identity calls ', () => {});
        it('should track updates for UPDATE Identity calls ', () => {});
        it('should track updates for DELETE Identity calls ', () => {});
    } );

    describe('CRUD Registry', () => {
        it('should track updates for CREATE Registry calls ', () => {});
        it('should track updates for RETRIEVE Registry calls ', () => {});
        it('should track updates for UPDATE Registry calls ', () => {});
        it('should track updates for DELETE Registry calls ', () => {});
    } );

    describe('CRUD Network', () => {
        it('should track updates for CREATE Network calls ', () => {});
        it('should track updates for RETRIEVE Network calls ', () => {});
        it('should track updates for UPDATE Network calls ', () => {});
        it('should track updates for DELETE Network calls ', () => {});
    } );

    describe('Transaction invocations' , () => {
        it('Succesful transaction should have contents recorded',()=>{});
        it('Unsuccesful transaction should not cause issues',()=>{});
    });

    describe('ACLs' , () => {
        it('Retrict access to historian registry',()=>{});
        it('Allow acces to historian regsitry, but not to transaction information',()=>{});
        it('Allow acces to historian regsitry, but not to event information',()=>{});
        it('Allow acces to historian regsitry, but not to participant or identity information',()=>{});
    });

    describe('Query', () => {
        it('For a given asset track how it has changed over time',() => {});
        it('For a given particpant track how what they have changed over time',() => {});
        it('For a given identity track how what they have changed over time',() => {});
        it('For a given regsitry track how what has affected over time',() => {});
        it('For a given transaction track what it has been used for',() => {});
    });

    let businessNetworkDefinition;

    before(function () {
        // In this systest we are fully specifying the model file with a fileName and content
        const modelFiles = [
            { fileName: 'models/accesscontrols.cto', contents: fs.readFileSync(path.resolve(__dirname, 'data/accesscontrols.cto'), 'utf8')}
        ];
        const scriptFiles = [
            { identifier: 'identities.js', contents: fs.readFileSync(path.resolve(__dirname, 'data/accesscontrols.js'), 'utf8') }
        ];
        businessNetworkDefinition = new BusinessNetworkDefinition('systest-historian@0.0.1', 'The network for the historian system tests');
        modelFiles.forEach((modelFile) => {
            businessNetworkDefinition.getModelManager().addModelFile(modelFile.contents, modelFile.fileName);
        });
        scriptFiles.forEach((scriptFile) => {
            let scriptManager = businessNetworkDefinition.getScriptManager();
            scriptManager.addScript(scriptManager.createScript(scriptFile.identifier, 'JS', scriptFile.contents));
        });
        let aclFile = businessNetworkDefinition.getAclManager().createAclFile('permissions.acl', fs.readFileSync(path.resolve(__dirname, 'data/accesscontrols.acl'), 'utf8'));
        businessNetworkDefinition.getAclManager().setAclFile(aclFile);
        return TestUtil.deploy(businessNetworkDefinition)
            .then(() => {
                // return TestUtil.getClient('systest-accesscontrols')
                //     .then((result) => {
                //         client = result;
                //     });
            });
    });

    beforeEach(() => { });

    afterEach(() => {  });

});
