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



// const uuid = require('uuid');

const TestUtil = require('./testutil');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));

process.setMaxListeners(Infinity);


let client;

let createAsset = (assetId) => {
    let factory = client.getBusinessNetwork().getFactory();
    let asset = factory.newResource('systest.assets', 'SimpleAsset', assetId);
    asset.stringValue = 'hello world';
    asset.stringValues = [ 'hello', 'world' ];
    asset.doubleValue = 3.142;
    asset.doubleValues = [ 4.567, 8.901 ];
    asset.integerValue = 1024;
    asset.integerValues = [ 32768, -4096 ];
    asset.longValue = 131072;
    asset.longValues = [ 999999999, -1234567890 ];
    asset.dateTimeValue = new Date('1994-11-05T08:15:30-05:00');
    asset.dateTimeValues = [ new Date('2016-11-05T13:15:30Z'), new Date('2063-11-05T13:15:30Z') ];
    asset.booleanValue = true;
    asset.booleanValues = [ false, true ];
    asset.enumValue = 'WOW';
    asset.enumValues = [ 'SUCH', 'MANY', 'MUCH' ];
    return asset;
};
describe('Historian', () => {

    describe.only('CRUD Asset', () => {
        it('should track updates for CREATE asset calls ', () => {
            let factory = client.getBusinessNetwork().getFactory();
            let assetRegistry,addAssetRegistry;
            let historian;
            let hrecords;
            return client
                .getAssetRegistry('systest.assets.SimpleAsset')
                .then(function (result) {
                    assetRegistry = result;
                })
                .then( () => {
                    let asset = createAsset('dogeAsset1');
                    return assetRegistry.add(asset);
                })
                .then(function () {
                    let asset = createAsset('dogeAsset2');
                    return assetRegistry.add(asset);
                })
                .then(function () {
                    let asset = createAsset('dogeAsset3');
                    return assetRegistry.add(asset);
                })
                .then( ()=>{
                    return client.getHistorian();
                }).then( (result)=>{
                    historian = result;
                    return historian.getAll();
                }).then ( (result) => {

                    // there should be a create asset record for the 3 assets
                    hrecords = result.filter((element)=>{
                        return element.transactionType==='org.hyperledger.composer.system.AddAsset';
                    });
                    hrecords.length.should.equal(3);
                    return client.getTransactionRegistry('org.hyperledger.composer.system.AddAsset');
                }).then((result)=>{
                    addAssetRegistry = result;
                    return addAssetRegistry.get(hrecords[0].transactionId);
                }).then((result) => {
                    console.log(result);

                    let relationship = factory.newRelationship('systest.assets', 'SimpleAsset', 'dogeAsset1');
                    client.getRegistry(relationship.getId());
                })
                ;
// .then( ()=>{})

        });

        it('Get the asset that is referenced from a relationship', () => {
            let factory = client.getBusinessNetwork().getFactory();
            let relationship = factory.newRelationship('systest.assets', 'SimpleAsset', 'dogeAsset1');
            /**
             * Relationship {
                    '$modelManager':
                    ModelManager {
                        modelFiles:
                        { 'org.hyperledger.composer.system': [Object],
                            'systest.assets': [Object] } },
                    '$namespace': 'systest.assets',
                    '$type': 'SimpleAsset',
                    '$identifier': 'dogeAsset1',
                    '$class': 'Relationship' }
             *
             *
             *
             */
            client.get;

        });
        it('should track updates for UPDATE asset calls ', () => { });
        it('should track updates for DELETE asset calls ', () => { });
    });

    describe('CRUD Participant', () => {
        it('should track updates for CREATE Participant calls ', () => { });
        it('should track updates for RETRIEVE Participant calls ', () => { });
        it('should track updates for UPDATE Participant calls ', () => { });
        it('should track updates for DELETE Participant calls ', () => { });
    });

    describe('CRUD Identity', () => {
        it('should track updates for CREATE Identity calls ', () => { });
        it('should track updates for RETRIEVE Identity calls ', () => { });
        it('should track updates for UPDATE Identity calls ', () => { });
        it('should track updates for DELETE Identity calls ', () => { });
    });

    describe('CRUD Registry', () => {
        it('should track updates for CREATE Registry calls ', () => { });
        it('should track updates for RETRIEVE Registry calls ', () => { });
        it('should track updates for UPDATE Registry calls ', () => { });
        it('should track updates for DELETE Registry calls ', () => { });
    });

    describe('CRUD Network', () => {
        it('should track updates for CREATE Network calls ', () => { });
        it('should track updates for RETRIEVE Network calls ', () => { });
        it('should track updates for UPDATE Network calls ', () => { });
        it('should track updates for DELETE Network calls ', () => { });
    });

    describe('Transaction invocations', () => {
        it('Succesful transaction should have contents recorded', () => { });
        it('Unsuccesful transaction should not cause issues', () => { });
    });

    describe('ACLs', () => {
        it('Retrict access to historian registry', () => { });
        it('Allow acces to historian regsitry, but not to transaction information', () => { });
        it('Allow acces to historian regsitry, but not to event information', () => { });
        it('Allow acces to historian regsitry, but not to participant or identity information', () => { });
    });

    describe('Query', () => {
        it('For a given asset track how it has changed over time', () => { });
        it('For a given particpant track how what they have changed over time', () => { });
        it('For a given identity track how what they have changed over time', () => { });
        it('For a given regsitry track how what has affected over time', () => { });
        it('For a given transaction track what it has been used for', () => { });
    });


    before(function () {
        // need factor this deployCommon out shortly.
        return TestUtil.deployCommon()
            .then(() => {
                return TestUtil.getClient()
                    .then((result) => {
                        client = result;
                    });
            });
    });

    beforeEach(() => { });

    afterEach(() => {
        return TestUtil.getClient()
            .then((result) => {
                client = result;
            });
    });




});
