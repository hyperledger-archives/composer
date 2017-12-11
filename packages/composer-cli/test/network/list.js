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

const Admin = require('composer-admin');
const BusinessNetworkDefinition = Admin.BusinessNetworkDefinition;
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const AssetRegistry = require('composer-client').AssetRegistry;
const fs = require('fs');
const List = require('../../lib/cmds/network/listCommand.js');
const ListCmd = require('../../lib/cmds/network/lib/list.js');
const CmdUtil = require('../../lib/cmds/utils/cmdutils.js');
const Serializer = require('composer-common').Serializer;
const Pretty = require('prettyjson');

require('chai').should();

const chai = require('chai');
const sinon = require('sinon');
chai.should();
chai.use(require('chai-things'));
chai.use(require('chai-as-promised'));

let testBusinessNetworkId = 'net.biz.TestNetwork-0.0.1';
let testBusinessNetworkDescription = 'Test network description';
let mockBusinessNetworkDefinition;
let mockBusinessNetworkConnection;
let mockAssetRegistry;
let mockSerializer;
let spyCmd;
let spyPretty;

describe('composer network list CLI unit tests', function () {

    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        mockSerializer = sinon.createStubInstance(Serializer);
        mockAssetRegistry = sinon.createStubInstance(AssetRegistry);

        mockBusinessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
        mockBusinessNetworkDefinition.identifier = testBusinessNetworkId;
        mockBusinessNetworkDefinition.description = testBusinessNetworkDescription;
        mockBusinessNetworkDefinition.modelManager = {'modelFiles':[{'name':'testModel'}]};
        mockBusinessNetworkDefinition.scriptManager = {'scripts':[{'name':'testScript'}]};

        mockBusinessNetworkConnection = sinon.createStubInstance(BusinessNetworkConnection);
        mockBusinessNetworkConnection.connect.returns(Promise.resolve(mockBusinessNetworkDefinition));

        mockBusinessNetworkDefinition.toArchive.resolves('bytearray');
        sandbox.stub(fs,'writeFileSync' );
        sandbox.stub(CmdUtil, 'createBusinessNetworkConnection').returns(mockBusinessNetworkConnection);
        sandbox.stub(process, 'exit');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('List handler() method tests', function () {

        beforeEach(() => {
            mockBusinessNetworkDefinition.getSerializer.returns(mockSerializer);
            mockSerializer.toJSON.returns('FOO');
            spyCmd = sinon.spy(CmdUtil, 'log');
            spyPretty = sinon.spy(Pretty, 'render');
        });

        afterEach(() => {
            CmdUtil.log.restore();
            Pretty.render.restore();
        });

        it('should list two registries with no assets.', function () {
            let argv = {card:'cardname'
                       ,archiveFile: 'testArchiveFile.zip'};
            sandbox.stub(ListCmd,'getMatchingRegistries').resolves([{id:'reg1','name':'reg1','registryType':'Asset','assets':{}},{id:'reg2','name':'reg2','registryType':'Asset','assets':{}}]);
            sandbox.stub(ListCmd,'getMatchingAssets').resolves([]);

            let PRETTY_ARG = { description: testBusinessNetworkDescription,
                name: undefined,
                identifier: 'net.biz.TestNetwork-0.0.1',
                models: [ '0' ],
                scripts: [ '0' ],
                registries:
                { reg1: { id: 'reg1', name: 'reg1', registryType: 'Asset' },
                    reg2: { id: 'reg2', name: 'reg2', registryType: 'Asset' } } };

            return List.handler(argv)
            .then ((result) => {
                argv.thePromise.should.be.a('promise');
                sinon.assert.calledOnce(mockBusinessNetworkConnection.connect);
                sinon.assert.calledWith(mockBusinessNetworkConnection.connect, 'cardname');
                sinon.assert.calledOnce(spyPretty);
                sinon.assert.calledWith(spyPretty, PRETTY_ARG);
                sinon.assert.calledOnce(spyCmd);
            });
        });

        it('should list two registries with an asset in each.', function () {
            let argv = {card:'cardname'
                       ,archiveFile: 'testArchiveFile.zip'};
            sandbox.stub(ListCmd,'getMatchingRegistries').resolves([{id:'reg1','name':'reg1','registryType':'Asset','assets':{}},{id:'reg2','name':'reg2','registryType':'Asset','assets':{}}]);
            sandbox.stub(ListCmd,'getMatchingAssets').resolves([{Asset : 'TestAsset', getIdentifier : function () {return 'ID';}}]);

            let PRETTY_ARG = { name: undefined,
                identifier: 'net.biz.TestNetwork-0.0.1',
                description: 'Test network description',
                models: [ '0' ],
                scripts: [ '0' ],
                registries:
                { reg1:
                { id: 'reg1',
                    name: 'reg1',
                    registryType: 'Asset',
                    assets: { ID: 'FOO' }
                },
                    reg2:
                    { id: 'reg2',
                        name: 'reg2',
                        registryType: 'Asset',
                        assets: { ID: 'FOO' }
                    } } };

            return List.handler(argv)
            .then ((result) => {

                argv.thePromise.should.be.a('promise');
                sinon.assert.calledOnce(mockBusinessNetworkConnection.connect);
                sinon.assert.calledWith(mockBusinessNetworkConnection.connect,'cardname');
                sinon.assert.calledOnce(spyPretty);
                sinon.assert.calledWith(spyPretty, PRETTY_ARG);
                sinon.assert.calledOnce(spyCmd);

            });
        });

        it('should list no registries.', function () {
            let argv = {card:'cardname'
                       ,archiveFile: 'testArchiveFile.zip'};
            sandbox.stub(ListCmd,'getMatchingRegistries').resolves({id:'reg1',participants:[],'name':'reg1','registryType':'Asset','assets':[]});

            let PRETTY_ARG = { name: undefined,
                identifier: 'net.biz.TestNetwork-0.0.1',
                description: 'Test network description',
                models: [ '0' ],
                scripts: [ '0' ],
                registries:{}};

            return List.handler(argv)
            .then ((result) => {
                argv.thePromise.should.be.a('promise');
                sinon.assert.calledOnce(mockBusinessNetworkConnection.connect);
                sinon.assert.calledWith(mockBusinessNetworkConnection.connect,'cardname');
                sinon.assert.calledOnce(spyPretty);
                sinon.assert.calledWith(spyPretty, PRETTY_ARG);
                sinon.assert.calledOnce(spyCmd);
            });
        });

        it('should list a participant and asset registry .', function () {
            let argv = {card:'cardname'
                       ,archiveFile: 'testArchiveFile.zip'};
            let mockReturnedRegistries = {assets : [{id : 'reg1'}], participants : [{id : 'p1'}]};
            sandbox.stub(ListCmd,'getMatchingRegistries').resolves(mockReturnedRegistries);
            sandbox.stub(ListCmd,'getMatchingAssets').resolves([]);

            let PRETTY_ARG = { name: undefined,
                identifier: 'net.biz.TestNetwork-0.0.1',
                description: 'Test network description',
                models: [ '0' ],
                scripts: [ '0' ],
                registries:{p1: { id: 'p1', name: undefined, registryType: undefined },
                    reg1: { id: 'reg1', name: undefined, registryType: undefined }}};

            return List.handler(argv)
            .then ((result) => {
                argv.thePromise.should.be.a('promise');
                sinon.assert.calledOnce(mockBusinessNetworkConnection.connect);
                sinon.assert.calledWith(mockBusinessNetworkConnection.connect,'cardname');
                sinon.assert.calledOnce(spyPretty);
                sinon.assert.calledWith(spyPretty, PRETTY_ARG);
                spyCmd.calledWith('');
            });
        });

        it('should list no assets.', function () {
            let argv = {card:'cardname'
                       ,archiveFile: 'testArchiveFile.zip'};
            sandbox.stub(ListCmd,'getMatchingRegistries').resolves({id:'reg1',participants:[],'name':'reg1','registryType':'Asset','assets':[]});
            sandbox.stub(ListCmd,'getMatchingAssets').resolves([]);

            let PRETTY_ARG = { name: undefined,
                identifier: 'net.biz.TestNetwork-0.0.1',
                description: 'Test network description',
                models: [ '0' ],
                scripts: [ '0' ],
                registries:{}};
            return List.handler(argv)
            .then ((result) => {
                argv.thePromise.should.be.a('promise');
                sinon.assert.calledOnce(mockBusinessNetworkConnection.connect);
                sinon.assert.calledWith(mockBusinessNetworkConnection.connect,'cardname');
                sinon.assert.calledOnce(spyPretty);
                sinon.assert.calledWith(spyPretty, PRETTY_ARG);
                spyCmd.calledWith('');
            });
        });

        it('should list one registry with no assets.', function () {
            let argv = {card:'cardname'
                       ,archiveFile: 'testArchiveFile.zip'};
            sandbox.stub(ListCmd,'getMatchingRegistries').resolves({id:'reg1',participants:[],'name':'reg1','registryType':'Asset','assets':[]});
            sandbox.stub(ListCmd,'getMatchingAssets').resolves([{Asset : 'TestAsset'}]);

            let PRETTY_ARG = { name: undefined,
                identifier: 'net.biz.TestNetwork-0.0.1',
                description: 'Test network description',
                models: [ '0' ],
                scripts: [ '0' ],
                registries:{}};

            return List.handler(argv)
            .then ((result) => {
                argv.thePromise.should.be.a('promise');
                sinon.assert.calledOnce(mockBusinessNetworkConnection.connect);
                sinon.assert.calledWith(mockBusinessNetworkConnection.connect,'cardname');
                sinon.assert.calledOnce(spyPretty);
                sinon.assert.calledWith(spyPretty, PRETTY_ARG);
                spyCmd.calledWith('');
            });
        });

        it('Bad path, an error is thrown.', function () {
            let argv = {card:'cardname'
                       ,archiveFile: 'testArchiveFile.zip'};
            sandbox.stub(ListCmd,'getMatchingRegistries').returns(new Error('MSG'));
            return List.handler(argv).should.eventually.be.rejectedWith('');
        });

    });





    describe('#getMatchingRegistries function tests', function () {
        const MOCK_ASSET_REGISTRIES = {'AssetRegistry' : 'FooAssetRegistry'};
        const MOCK_PARTICIPANT_REGISTRIES = {'ParticipantRegistry' : 'BarParticipantRegistry'};
        it('should get all registries', function () {
            mockBusinessNetworkConnection.getAllAssetRegistries.returns(Promise.resolve(MOCK_ASSET_REGISTRIES));
            mockBusinessNetworkConnection.getAllParticipantRegistries.returns(Promise.resolve(MOCK_PARTICIPANT_REGISTRIES));
            let argv = 'mockRegistryIdentifier';
            ListCmd.getMatchingRegistries(argv, mockBusinessNetworkConnection)
            .then((result) => {
                result.should.deep.equal({assets : MOCK_ASSET_REGISTRIES, participants : MOCK_PARTICIPANT_REGISTRIES});
            });
        });

        it('should get a specific asset registry', function () {
            let ARGV = {registry : 'TestAssetRegistry'};
            const MOCK_RESULT = [{'AssetRegistry' : ARGV.registry}];
            mockBusinessNetworkConnection.assetRegistryExists.withArgs(ARGV.registry).returns(Promise.resolve(true));
            mockBusinessNetworkConnection.getAssetRegistry.withArgs(ARGV.registry).returns(Promise.resolve(MOCK_RESULT));
            ListCmd.getMatchingRegistries(ARGV, mockBusinessNetworkConnection)
            .then((result) => {
                result.should.deep.equal([MOCK_RESULT]);
            });
        });

        it('should get a specific participant registry', function () {
            let ARGV = {registry : 'TestParticipantRegistry'};
            const MOCK_RESULT = [{'ParticipantRegistry' : ARGV.registry}];
            mockBusinessNetworkConnection.assetRegistryExists.withArgs(ARGV.registry).returns(Promise.resolve(false));
            mockBusinessNetworkConnection.participantRegistryExists.withArgs(ARGV.registry).returns(Promise.resolve(true));
            mockBusinessNetworkConnection.getParticipantRegistry.withArgs(ARGV.registry).returns(Promise.resolve(MOCK_RESULT));
            ListCmd.getMatchingRegistries(ARGV, mockBusinessNetworkConnection)
            .then((result) => {
                result.should.deep.equal([MOCK_RESULT]);
            });
        });

        it('should throw an error if the specified registry is neither a valid asset registry or participant registry', function () {
            let ARGV = {registry : 'InvalidRegistry'};
            mockBusinessNetworkConnection.assetRegistryExists.withArgs(ARGV.registry).returns(Promise.resolve(false));
            mockBusinessNetworkConnection.participantRegistryExists.withArgs(ARGV.registry).returns(Promise.resolve(false));
            let EXPECTED_ERR = 'Registry '+ARGV.registry+' does not exist';
            ListCmd.getMatchingRegistries(ARGV, mockBusinessNetworkConnection).should.eventually.be.rejectedWith(EXPECTED_ERR);
        });
    });

    describe('#getMatchingAssets function tests', function () {

        it('should return a list of all assets for the specified registry when no asset is specified', function () {
            let ARGV = {};
            let MOCK_RETURN = {Asset : 'AnAsset'};
            mockAssetRegistry.getAll.returns(Promise.resolve(MOCK_RETURN));
            ListCmd.getMatchingAssets(mockAssetRegistry, ARGV)
            .then((result) => {
                result.should.deep.equal(MOCK_RETURN);
            });
        });

        it('should return the specified asset from the specified registry', function () {
            let ARGV = { asset : 'foo' };
            let MOCK_RETURN = {Asset : 'AFooAsset'};
            mockAssetRegistry.get.withArgs(ARGV.asset).returns(Promise.resolve(MOCK_RETURN));
            ListCmd.getMatchingAssets(mockAssetRegistry, ARGV)
            .then((result) => {
                result.should.deep.equal(MOCK_RETURN);
            });
        });

        it('should throw an error when an invalid asset is specified', function () {
            let ARGV = { asset : 'foo' };
            mockAssetRegistry.id = 'TEST_REGISTRY_ID';
            let EXPECTED_ERR = 'Asset in TEST_REGISTRY_ID does not exist';
            mockAssetRegistry.get.withArgs(ARGV.asset).returns(Promise.resolve(undefined));
            ListCmd.getMatchingAssets(mockAssetRegistry, ARGV).should.eventually.be.rejectedWith(EXPECTED_ERR);

        });

    });

    describe('#getError function tests', function () {
        it('should return an error message if one is given', function() {
            let MSG = 'ERROR';
            let ERROR = {message : MSG};
            ListCmd.getError(ERROR).should.equal(MSG);
        });
        it('should return what it is given if what is given contains no .message property', function() {
            let MSG = 'ERROR';
            let ERROR = {errorThing : MSG};
            ListCmd.getError(ERROR).should.deep.equal(ERROR);
        });
    });

});
