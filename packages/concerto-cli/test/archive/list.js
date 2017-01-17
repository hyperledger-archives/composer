/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Concerto - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
 */

'use strict';

const Admin = require('@ibm/concerto-admin');
const BusinessNetworkDefinition = Admin.BusinessNetworkDefinition;
// const homedir = require('homedir');
const fs = require('fs');
const List = require('../../lib/cmds/archive/listCommand.js');
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
// const CREDENTIALS_ROOT = homedir() + '/.concerto-credentials';

let mockBusinessNetworkDefinition;
// const DEFAULT_PROFILE_NAME = 'defaultProfile';

let mockAdminConnection;

describe('concerto archive list unit tests', function () {

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

    describe('Deploy handler() method tests', function () {

        it('Good path, all parms correctly specified.', function () {

            let argv = {archiveFile: 'testArchiveFile.zip'};

            return List.handler(argv)
            .then ((result) => {
                sinon.assert.calledOnce(BusinessNetworkDefinition.fromArchive);
                sinon.assert.calledOnce(mockBusinessNetworkDefinition.getName);
                sinon.assert.calledOnce(mockBusinessNetworkDefinition.getIdentifier);
                sinon.assert.calledOnce(mockBusinessNetworkDefinition.getVersion);
                sinon.assert.calledOnce(fs.readFileSync);
            });
        });
    });

});
