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

const Admin = require('@ibm/ibm-concerto-admin');
const BusinessNetworkDefinition = Admin.BusinessNetworkDefinition;
const fs = require('fs');
const DeployCommand = ('../lib/deploy.js');

require('../lib/deploy.js');
require('chai').should();

const chai = require('chai');
const sinon = require('sinon');
require('sinon-as-promised');
chai.should();
chai.use(require('chai-things'));

let mockBusinessNetworkDefinition;
let mockAdminConnection;

let testBusinessNetworkArchive = {bna: 'TBNA'};
let testBusinessNetworkDefinition = {bnd: 'TBND'};
//let testAdminConnection = {anc: 'TANC'};
let testBusinessNetworkId = 'net.biz.TestNetwork-0.0.1';
let testBusinessNetworkDescription = 'Test network description';

mockBusinessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
mockBusinessNetworkDefinition.getIdentifier.returns(testBusinessNetworkId);
mockBusinessNetworkDefinition.getDescription.returns(testBusinessNetworkDescription);

mockAdminConnection = sinon.createStubInstance(Admin.AdminConnection);
mockAdminConnection.createProfile.returns(Promise.resolve());
mockAdminConnection.connect.returns(Promise.resolve());
mockAdminConnection.deploy.returns(Promise.resolve());

describe('concerto deploy network CLI unit tests', function () {

    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        sandbox.stub(fs,'existsSync').returns(true);
        sandbox.stub(fs,'readFileSync').returns(testBusinessNetworkArchive);
        sandbox.stub(BusinessNetworkDefinition, 'fromArchive').returns(testBusinessNetworkDefinition);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('Good path, all parms correctly specified.', function () {

        let argv = {enrollId: 'WebAppAdmin'
                   ,enrollSecret: 'DJY27pEnl16d'
                   ,archiveFile: ''
        };
        let promises = [];
        promises.push = DeployCommand.handler(argv);
        // use asserts to check correct values being passed between functions...
//        deployPromise.should.be.equal('test');
    });

});
