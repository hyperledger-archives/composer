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
// const homedir = require('homedir');
const fs = require('fs');
// const Download = require('../../lib/cmds/network/lib/download.js');
const DownloadCmd = require('../../lib/cmds/network/downloadCommand.js');
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
//
// //const DEFAULT_PROFILE_NAME = 'defaultProfile';
// const CREDENTIALS_ROOT = homedir() + '/.composer-credentials';
//
let mockBusinessNetworkDefinition;
// const DEFAULT_PROFILE_NAME = 'defaultProfile';
// let businessNetworkConnection = new BusinessNetworkConnection();
let mockBusinessNetworkConnection;

describe('composer network download CLI unit tests', function () {

    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();

        mockBusinessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
        mockBusinessNetworkDefinition.getIdentifier.returns(testBusinessNetworkId);
        mockBusinessNetworkDefinition.getDescription.returns(testBusinessNetworkDescription);

        mockBusinessNetworkConnection = sinon.createStubInstance(BusinessNetworkConnection);
        mockBusinessNetworkConnection.connect.resolves(mockBusinessNetworkDefinition);

        mockBusinessNetworkDefinition.toArchive.resolves('bytearray');
        // sandbox.stub(Download.businessNetworkConnection,mockBusinessNetworkConnection);
        sandbox.stub(fs,'writeFileSync' );
        // sandbox.stub(businessNetworkConnection, 'connect').returns(mockBusinessNetworkDefinition);
        sandbox.stub(CmdUtil, 'createBusinessNetworkConnection').returns(mockBusinessNetworkConnection);
        sandbox.stub(process, 'exit');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('Download handler() method tests', function () {

        it('Good path, all parms correctly specified.', function () {

            let argv = {enrollId: 'WebAppAdmin'
                       ,enrollSecret: 'DJY27pEnl16d'
                       ,archiveFile: 'testArchiveFile.zip'
                       ,connectionProfileName: 'defaultProfile'};



            return DownloadCmd.handler(argv)
            .then ((result) => {
                // sinon.assert.calledOnce(mockBusinessNetworkDefinition.toArchive);
                // sinon.assert.calledOnce(BusinessNetworkDefinition.getIdentifier);
                // sinon.assert.calledOnce(BusinessNetworkDefinition.getDescription);
                sinon.assert.calledOnce(fs.writeFileSync);
            });
        });



    });

});
