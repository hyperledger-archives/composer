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
const fs = require('fs');
const List = require('../../lib/cmds/archive/listCommand.js');
const CmdUtil = require('../../lib/cmds/utils/cmdutils.js');

require('chai').should();

const chai = require('chai');
const sinon = require('sinon');
chai.should();
chai.use(require('chai-things'));
chai.use(require('chai-as-promised'));

let testBusinessNetworkId = 'net.biz.TestNetwork-0.0.1';
let testBusinessNetworkDescription = 'Test network description';


let mockBusinessNetworkDefinition;

let mockAdminConnection;

describe('composer archive list unit tests', function () {

    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();

        mockBusinessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
        mockBusinessNetworkDefinition.getIdentifier.returns(testBusinessNetworkId);
        mockBusinessNetworkDefinition.getDescription.returns(testBusinessNetworkDescription);
        mockBusinessNetworkDefinition.toArchive.resolves('bytearray');

        sandbox.stub(BusinessNetworkDefinition, 'fromArchive').resolves(mockBusinessNetworkDefinition);
        // sandbox.stub(BusinessNetworkDefinition, 'toArchive').resolves('bytearray');
        sandbox.stub(CmdUtil, 'createAdminConnection').returns(mockAdminConnection);
        sandbox.stub(fs,'readFileSync' );
        sandbox.stub(process, 'exit');

    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('List handler() method tests', function () {

        it('Good path, all parms correctly specified.', function () {

            let argv = {archiveFile: 'testArchiveFile.zip'};

            return List.handler(argv)
            .then ((result) => {
                argv.thePromise.should.be.a('promise');
                sinon.assert.calledOnce(BusinessNetworkDefinition.fromArchive);
                sinon.assert.calledOnce(mockBusinessNetworkDefinition.getName);
                sinon.assert.calledOnce(mockBusinessNetworkDefinition.getIdentifier);
                sinon.assert.calledOnce(mockBusinessNetworkDefinition.getVersion);
                sinon.assert.calledOnce(fs.readFileSync);
            });
        });
    });

});
