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
// const homedir = require('homedir');
const fs = require('fs');
const Create = require('../../lib/cmds/archive/createCommand.js');
const CmdUtil = require('../../lib/cmds/utils/cmdutils.js');

//require('../lib/deploy.js');
require('chai').should();

const chai = require('chai');
const sinon = require('sinon');
require('sinon-as-promised');
chai.should();
chai.use(require('chai-things'));
chai.use(require('chai-as-promised'));

// let testBusinessNetworkArchive = {bna: 'TBNA'};
let testBusinessNetworkId = 'net.biz.TestNetwork-0.0.1';
let testBusinessNetworkDescription = 'Test network description';

//const DEFAULT_PROFILE_NAME = 'defaultProfile';
// const CREDENTIALS_ROOT = homedir() + '/.composer-credentials';

let mockBusinessNetworkDefinition;
// const DEFAULT_PROFILE_NAME = 'defaultProfile';

let mockAdminConnection;

describe('composer archive create unit tests', function () {

    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();

        mockBusinessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
        mockBusinessNetworkDefinition.getIdentifier.returns(testBusinessNetworkId);
        mockBusinessNetworkDefinition.getDescription.returns(testBusinessNetworkDescription);
        mockBusinessNetworkDefinition.toArchive.resolves('bytearray');

        sandbox.stub(BusinessNetworkDefinition, 'fromDirectory').resolves(mockBusinessNetworkDefinition);
        // sandbox.stub(BusinessNetworkDefinition, 'toArchive').resolves('bytearray');
        sandbox.stub(CmdUtil, 'createAdminConnection').returns(mockAdminConnection);
        sandbox.stub(fs,'writeFileSync' );
        sandbox.stub(process, 'exit');

    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('Deploy handler() method tests', function () {

        it('Good path, all parms correctly specified.', function () {

            let argv = {archiveFile: 'testArchiveFile.zip'
                        , sourceType: 'dir'
                       ,sourceName: '/home/mwhite/biznet'};

            return Create.handler(argv)
            .then ((result) => {
                sinon.assert.calledOnce(BusinessNetworkDefinition.fromDirectory);
                sinon.assert.calledOnce(mockBusinessNetworkDefinition.toArchive);
                sinon.assert.calledOnce(fs.writeFileSync);
            });
        });

        it('Good path, all parms correctly specified & cwd ', function () {

            let argv = {archiveFile: 'testArchiveFile.zip'
            ,sourceType: 'dir'
           ,sourceName:  '.'};

            return Create.handler(argv)
            .then ((result) => {
                sinon.assert.calledOnce(BusinessNetworkDefinition.fromDirectory);
                sinon.assert.calledOnce(mockBusinessNetworkDefinition.toArchive);
                sinon.assert.calledOnce(fs.writeFileSync);
            });
        });

        it('Good path, all parms correctly specified - no archive', function () {

            let argv = {sourceType: 'dir'
           ,sourceName:  '/home/mwhite/biznet'};

            return Create.handler(argv)
            .then ((result) => {
                sinon.assert.calledOnce(BusinessNetworkDefinition.fromDirectory);
                sinon.assert.calledOnce(mockBusinessNetworkDefinition.toArchive);
                sinon.assert.calledOnce(fs.writeFileSync);
            });
        });

        it('Good path, module name - archivefile & modulename that exists', function () {

            let argv = {archiveFile: 'testArchiveFile.zip',
                moduleName: 'fs'};

            return Create.handler(argv)
            .then ((result) => {
                sinon.assert.calledOnce(BusinessNetworkDefinition.fromDirectory);
                sinon.assert.calledOnce(mockBusinessNetworkDefinition.toArchive);
                sinon.assert.calledOnce(fs.writeFileSync);
            });
        });

        it('Good path, module name - archivefile & modulename that does not exists', function () {

            let argv = {archiveFile: 'testArchiveFile.zip',
                sourceType: 'module', sourceName: 'fake'};

            try{
                return Create.handler(argv)
            .then ((result) => {
                sinon.assert.calledOnce(BusinessNetworkDefinition.fromDirectory);
                sinon.assert.calledOnce(mockBusinessNetworkDefinition.toArchive);
                sinon.assert.calledOnce(fs.writeFileSync);
            });
            }      catch(err){
                err.code.should.equals('MODULE_NOT_FOUND');
            }
        });

    });

});
